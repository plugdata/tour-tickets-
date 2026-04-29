# Agent Room — วิธีใช้งาน

## โครงสร้าง 3 Layer

```
Layer 1 — context/layer1-structure.json   ← โครงสร้าง project (คงที่)
Layer 2 — context/layer2-ops.json         ← task ปัจจุบัน (Gemini เขียน, Claude อ่าน)
Rules   — rules/agent-rules.json          ← บทบาท + กฎการสื่อสาร
```

## วิธีสั่งงาน

```bash
# พิมพ์ task เป็นภาษาไทยหรืออังกฤษก็ได้
cd /d/project_ticket
bash .agent/agent-room.sh "เพิ่ม field phone ใน InsuranceForm"
bash .agent/agent-room.sh "แก้ function createBooking ใน booking.routes.js ให้ validate seats > 0"
bash .agent/agent-room.sh "เพิ่ม endpoint GET /api/reports/monthly ใน report.routes.js"
```

## Flow ที่เกิดขึ้น

```
คุณพิมพ์ task
    ↓
[GEMINI] อ่าน layer1 + แปลเป็น English JSON → เขียน layer2-ops.json
    ↓
[CLAUDE] อ่าน layer2-ops.json + ดึง code จาก code-review-graph → แก้ไฟล์
    ↓
บันทึก session log
```

## layer2-ops.json ตัวอย่าง (Gemini เขียน)

```json
{
  "task": {
    "id": "task-20260429-143000",
    "type": "add",
    "target": {
      "file": "backend/src/routes/booking.routes.js",
      "function": "createBooking"
    },
    "action": "Add validation: return 400 if seats <= 0",
    "context_refs": ["Booking", "BusRound"],
    "constraints": { "output_format": "diff" },
    "status": "pending"
  }
}
```

## อัพเดท layer1 หลังแก้โค้ด

```bash
code-review-graph update
```
