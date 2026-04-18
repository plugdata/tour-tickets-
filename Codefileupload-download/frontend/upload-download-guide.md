# คู่มือการใช้งานระบบ File Upload & Download

ชุดคำสั่งนี้ได้รวมศูนย์การจัดการไฟล์ (PDF, รูปภาพ, เอกสาร) และการบันทึกลงฐานข้อมูล Prisma ไว้ในที่เดียว เพื่อให้นำไปใช้ใน Feature อื่นๆ ได้ง่าย

## 1. ส่วนประกอบของ Code
- `/server/storage-config.js`: จัดการ Path ของ Folder และตรวจสอบความมีอยู่ของ Folder (`public/uploads/documents` และ `public/uploads/images`)
- `/server/upload-api.js`: รวม Logic ของ API ทั้ง Document และ Map Image ไว้ในที่เดียว รองรับการอัปเกรดและเชื่อมโยงกับ Model อื่นๆ
- `/database/prisma-schema-snippet.prisma`: ตัวอย่างโครงสร้าง Table `Uploads` ในฐานข้อมูล
- `/frontend/document-upload.html`: ตัวอย่างหน้าจอการอัปโหลดไฟล์ (UI)
- `/frontend/document-download.html`: ตัวอย่างหน้าจอการค้นหาและดาวน์โหลดไฟล์ (UI)

## 2. วิธีนำไปติดตั้ง
1. คัดลอกไฟล์ในโฟลเดอร์ `server` ไปวางในโปรเจกต์ของคุณ
2. ในไฟล์หลักของระบบ (เช่น `index.js` หรือ `app.js`) ให้นำ Route ไปใช้งาน:
   ```javascript
   import uploadRouter from './path/to/upload-api.js'
   app.use('/api/v2/files', uploadRouter)
   ```
3. ตรวจสอบให้แน่ใจว่าได้ตั้งค่า Folder `public/uploads` ไว้ใน Web Server (เช่น `express.static`)

## 3. วิธีใช้งาน (Frontend)

### การอัปโหลดไฟล์ (POST)
Endpoint: `/api/v2/files/upload`
Method: `POST` (Multipart/FormData)

**Parameters:**
- `files`: (File Array) ไฟล์ที่ต้องการอัปโหลด
- `mapId`: (Optional) ID ของ Map ที่ต้องการผูก
- `riskZoneId`: (Optional) ID ของ RiskZone ที่ต้องการผูก
- `type`: (Optional) ระบุ `'image'` เพื่อบังคับให้เก็บในโฟลเดอร์รูปภาพ

### การดึงข้อมูลไฟล์ (GET)
Endpoint: `/api/v2/files`
Query: `?type=image` (กรองตามประเภท) หรือ `?mapId=1` (กรองตาม Map)

### การลบไฟล์ (DELETE)
Endpoint: `/api/v2/files/:id`

## 4. โครงสร้างโฟลเดอร์ที่ถูกจัดการ
ระบบจะสร้างโฟลเดอร์อัตโนมัติที่:
- `public/uploads/documents/` : สำหรับไฟล์ PDF, Word, Excel, ฯลฯ
- `public/uploads/images/` : สำหรับไฟล์รูปภาพ JPG, PNG

---
*หมายเหตุ: ระบบรองรับการอ่านชื่อไฟล์ภาษาไทย และป้องกันการเขียนทับไฟล์เดิมด้วยการเติม Timestamp หากชื่อซ้ำ*
