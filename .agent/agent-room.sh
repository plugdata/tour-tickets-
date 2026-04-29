#!/bin/bash
# agent-room.sh v2 — Gemini (Logic) → Claude (Code) with clarification loop
# Usage: bash .agent/agent-room.sh "task description"

AGENT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAYER1="$AGENT_DIR/context/layer1-structure.json"
LAYER2="$AGENT_DIR/context/layer2-ops.json"
ROOM_LOG="$AGENT_DIR/context/room-log.jsonl"
SESSION_ID="session-$(date +%Y%m%d-%H%M%S)"
SESSION_LOG="$AGENT_DIR/sessions/$SESSION_ID.json"
TMPDIR_LOCAL="$AGENT_DIR/sessions"
PY="/c/WINDOWS/py"

PY_JSON() { $PY -c "import json,sys; print(json.dumps(sys.stdin.read().strip()))" 2>/dev/null; }
GET_FIELD() { $PY -c "
import json
try:
  d=json.load(open('$LAYER2'))
  print(d.get('$1') or d.get('task',{}).get('$1') or '')
except: print('')
" 2>/dev/null; }

log_room() {
  local role="$1" type="$2" msg="$3"
  local ts; ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  local msg_json; msg_json=$(echo "$msg" | PY_JSON)
  echo "{\"session\":\"$SESSION_ID\",\"ts\":\"$ts\",\"role\":\"$role\",\"type\":\"$type\",\"msg\":$msg_json}" >> "$ROOM_LOG"
}

hr()  { echo ""; echo "┌─ [$1] ──────────────────────────────────────"; }
end() { echo "└──────────────────────────────────────────────"; }

# ── validate ──────────────────────────────────────────────────────────────────
USER_TASK="${1:-}"
[ -z "$USER_TASK" ] && echo "Usage: bash .agent/agent-room.sh \"task\"" && exit 1

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  AGENT ROOM v2  ·  $SESSION_ID"
echo "╚════════════════════════════════════════════╝"
echo "  TASK: $USER_TASK"
echo ""
log_room "human" "task" "$USER_TASK"

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 1 — GEMINI: translate task → layer2-ops.json
# ══════════════════════════════════════════════════════════════════════════════
GEMINI_ROUND=0
CLARIFICATION=""

while true; do
  GEMINI_ROUND=$((GEMINI_ROUND + 1))
  hr "GEMINI — round $GEMINI_ROUND"
  echo "  Translating task to JSON..."

  # Write prompt to temp file (avoid bash arg-length limits)
  PROMPT_FILE="$TMPDIR_LOCAL/gemini-prompt-$SESSION_ID.txt"
  cat > "$PROMPT_FILE" <<PROMPT
You are a Logic Architect agent for a Tour Booking System.

PROJECT STRUCTURE:
$(cat "$LAYER1")

USER TASK: $USER_TASK
$([ -n "$CLARIFICATION" ] && echo "HUMAN CLARIFICATION: $CLARIFICATION")

Rules:
- Find exact file and function from the project structure above
- If CLEAR → _status: ready, task.status: pending
- If AMBIGUOUS → _status: needs_clarification, task.status: needs_clarification, questions: [list max 3 questions]
- Output ONLY raw valid JSON — no markdown, no backticks, no explanation
- action field: English, under 30 words

Output exactly this schema:
{
  "_schema": "layer2-ops v1.0",
  "_status": "ready",
  "task": {
    "id": "$SESSION_ID",
    "type": "edit",
    "priority": "medium",
    "target": {
      "file": "backend/prisma/schema.prisma",
      "function": "",
      "class": "Expense",
      "line": null
    },
    "action": "Add optional String notes field to Expense model",
    "questions": [],
    "context_refs": ["Expense"],
    "constraints": {
      "no_new_files": false,
      "keep_existing_logic": true,
      "output_format": "diff"
    },
    "status": "pending",
    "executed_by": "",
    "result_summary": ""
  }
}
PROMPT

  GEMINI_CLI_TRUST_WORKSPACE=true gemini -p "$(cat "$PROMPT_FILE")" 2>/dev/null > "$LAYER2"
  rm -f "$PROMPT_FILE"
  end

  # validate output
  STATUS=$(GET_FIELD "_status")
  TASK_STATUS=$(GET_FIELD "status")

  echo ""
  echo "  layer2-ops.json:"
  cat "$LAYER2"
  echo ""
  log_room "gemini" "analysis" "$(cat "$LAYER2")"

  # clear → proceed
  if [ "$STATUS" = "ready" ] || [ "$TASK_STATUS" = "pending" ]; then
    echo "  ✓ Gemini: clear — handing to Claude"
    break
  fi

  # ambiguous → ask human
  if [ "$STATUS" = "needs_clarification" ] || [ "$TASK_STATUS" = "needs_clarification" ]; then
    hr "GEMINI → YOU"
    echo "  Gemini needs clarification:"
    echo ""
    $PY -c "
import json
try:
  d=json.load(open('$LAYER2'))
  qs=d.get('task',{}).get('questions',[])
  [print(f'  {i+1}. {q}') for i,q in enumerate(qs)]
except: print('  (no questions found)')
" 2>/dev/null
    end
    echo ""
    read -rp "  Your answer: " HUMAN_ANSWER
    echo ""
    log_room "human" "clarification" "$HUMAN_ANSWER"
    CLARIFICATION="$HUMAN_ANSWER"
    [ $GEMINI_ROUND -ge 3 ] && echo "  ⚠ Max rounds — proceeding with best guess" && break
  else
    break
  fi
done

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 2 — CLAUDE: execute task
# ══════════════════════════════════════════════════════════════════════════════
hr "CLAUDE"
echo "  Executing task from layer2-ops.json..."
echo ""

CLAUDE_PROMPT="You are a Code Executor agent.

Read .agent/context/layer2-ops.json then execute the task exactly.

Rules:
- Use code-review-graph MCP to fetch only relevant code (minimize tokens)
- If genuinely ambiguous after reading the file, respond with this JSON only:
  {\"claude_doubt\": true, \"questions\": [\"question1\", \"question2\"]}
- Otherwise: apply the change and show unified diff
- After done: update .agent/context/layer2-ops.json — set status=done, executed_by=claude-sonnet-4-6, result_summary (1 sentence)
- No prose, no explanation — diff only"

CLAUDE_OUT=$(claude "$CLAUDE_PROMPT" 2>&1)
echo "$CLAUDE_OUT"
end
log_room "claude" "execution" "$CLAUDE_OUT"

# check if Claude has doubt
HAS_DOUBT=$(echo "$CLAUDE_OUT" | $PY -c "
import json,sys
t=sys.stdin.read()
try:
  s=t.index('{'); e=t.rindex('}')+1
  print('yes' if json.loads(t[s:e]).get('claude_doubt') else 'no')
except: print('no')
" 2>/dev/null || echo "no")

if [ "$HAS_DOUBT" = "yes" ]; then
  hr "CLAUDE → YOU"
  echo "  Claude needs clarification:"
  echo ""
  echo "$CLAUDE_OUT" | $PY -c "
import json,sys
t=sys.stdin.read()
try:
  s=t.index('{')
  qs=json.loads(t[s:t.rindex('}')+1]).get('questions',[])
  [print(f'  {i+1}. {q}') for i,q in enumerate(qs)]
except: pass
" 2>/dev/null
  end
  echo ""
  read -rp "  Your answer: " CLAUDE_ANS
  echo ""
  log_room "human" "clarification_to_claude" "$CLAUDE_ANS"

  hr "CLAUDE — round 2"
  claude "$CLAUDE_PROMPT

HUMAN CLARIFICATION: $CLAUDE_ANS
Now execute." 2>&1
  end
fi

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 3 — LOG SESSION
# ══════════════════════════════════════════════════════════════════════════════
hr "SYSTEM"
RESULT=$(GET_FIELD "result_summary")
TFILE=$(GET_FIELD "file")
ACTION=$(GET_FIELD "action")

cat > "$SESSION_LOG" <<EOF
{
  "session_id": "$SESSION_ID",
  "ts": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "user_task": "$USER_TASK",
  "gemini_rounds": $GEMINI_ROUND,
  "target_file": "$TFILE",
  "action": "$ACTION",
  "result": "$RESULT",
  "ops": $(cat "$LAYER2")
}
EOF

echo "  ✓ session → $SESSION_LOG"
echo "  ✓ room log → $ROOM_LOG"
end

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  DONE ✓  $SESSION_ID"
echo "╚════════════════════════════════════════════╝"
echo "  file   : $TFILE"
echo "  action : $ACTION"
echo "  result : $RESULT"
echo ""
