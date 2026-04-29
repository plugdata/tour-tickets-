# Agent Room — คู่มือการใช้งาน

## ภาพรวมระบบ

```
คุณพิมพ์ task (ภาษาไทยหรืออังกฤษ)
         │
         ▼
   ┌─────────────┐
   │   GEMINI    │  วิเคราะห์ task → แปลเป็น JSON (English, < 30 words)
   │  (Logic)    │  ถ้าไม่ชัด → ถามคุณก่อน (max 3 รอบ)
   └──────┬──────┘
          │  layer2-ops.json
          ▼
   ┌─────────────┐
   │   CLAUDE    │  อ่าน JSON → ดึง code จาก graph → แก้ไฟล์
   │  (Code)     │  ถ้าไม่ชัด → ถามคุณก่อน execute
   └──────┬──────┘
          │
          ▼
   session log + room log (บันทึกอัตโนมัติ)
```

---

## โครงสร้าง .agent/

```
.agent/
├── agent-room.sh              ← script หลัก (รันบรรทัดเดียว)
├── MANUAL.md                  ← คู่มือนี้
│
├── context/
│   ├── layer1-structure.json  ← โครงสร้าง project (อัพเดทด้วย code-review-graph)
│   ├── layer2-ops.json        ← task ปัจจุบัน (Gemini เขียน → Claude อ่าน)
│   └── room-log.jsonl         ← log บทสนทนาทุก session (append)
│
├── rules/
│   └── agent-rules.json       ← บทบาท + กฎ Gemini/Claude
│
├── sessions/
│   └── session-YYYYMMDD-HHMMSS.json  ← log แต่ละครั้ง
│
├── docs/                      ← เอกสาร architecture
└── workflows/                 ← workflow reference
```

---

## วิธีรัน

```bash
cd /d/project_ticket
bash .agent/agent-room.sh "task ที่ต้องการ"
```

---

## ตัวอย่าง Tasks

### แก้ไข function
```bash
bash .agent/agent-room.sh "แก้ createBooking ใน booking.routes.js ให้ validate seats > 0"
```

### เพิ่ม field
```bash
bash .agent/agent-room.sh "เพิ่ม field notes ใน Expense model ใน prisma schema"
```

### เพิ่ม endpoint ใหม่
```bash
bash .agent/agent-room.sh "เพิ่ม GET /api/reports/monthly ใน report.routes.js"
```

### แก้หน้า frontend
```bash
bash .agent/agent-room.sh "เพิ่ม error message ในหน้า booking/form.html เมื่อ API ล้มเหลว"
```

### Refactor
```bash
bash .agent/agent-room.sh "แยก validate logic ออกจาก createPayment เป็น function แยก"
```

---

## Flow เมื่อ Gemini ไม่ชัดเจน

```
AGENT ROOM v2
  TASK: เพิ่ม notification

┌─ [GEMINI — round 1]
  Translating task to JSON...

┌─ [GEMINI → YOU]
  Gemini needs clarification:

  1. notification ส่งทาง email หรือ in-app?
  2. trigger เมื่อ booking status เปลี่ยน หรือ payment confirm?

  Your answer: _   ← คุณตอบตรงนี้
```

---

## Flow เมื่อ Claude ไม่ชัดเจน

```
┌─ [CLAUDE → YOU]
  Claude needs clarification:

  1. ต้องการ overwrite logic เดิมหรือ extend?

  Your answer: _   ← คุณตอบตรงนี้
```

---

## ดู Logs

```bash
# ดู room log ทุก session (แบบ stream)
cat .agent/context/room-log.jsonl

# ดู session ล่าสุด
ls -t .agent/sessions/ | head -1 | xargs -I{} cat .agent/sessions/{}

# ดู task ปัจจุบัน
cat .agent/context/layer2-ops.json
```

---

## อัพเดท layer1 หลังแก้โค้ด

```bash
code-review-graph update
```
ทำทุกครั้งหลังเพิ่ม model ใหม่หรือ refactor ใหญ่

---

## กฎบทบาท (agent-rules.json)

| Agent | บทบาท | Input | Output |
|---|---|---|---|
| **Gemini** | Logic Architect | task + layer1 | layer2-ops.json (English JSON) |
| **Claude** | Code Executor | layer2-ops.json + MCP | code diff + update status |
| **Human** | Director | — | task + clarification answers |

---

## Token ที่ประหยัดได้

| วิธีเดิม | วิธีใหม่ |
|---|---|
| อธิบาย context ใหม่ทุกครั้ง | layer1 อ้างอิงได้เลย |
| Claude อ่านทั้ง project | Claude ดึงเฉพาะ function ผ่าน MCP |
| พิมพ์ไทย → Claude แปลเอง | Gemini แปล → Claude รับ English |
| ไม่มี audit trail | room-log.jsonl บันทึกทุก turn |

ประหยัด **~60-80%** ต่อ task เทียบกับคุยตรงกับ Claude
