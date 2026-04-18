---
description: วิธีแก้ไข Prisma Schema และข้อระวังสำคัญ (บทเรียนจากโปรเจกต์นี้)
---

# ⚠️ ข้อระวังสำคัญก่อนแก้ไข Prisma Schema

## สาเหตุที่ทำให้ระบบพังในอดีต

### 1. Model ซ้ำกันใน schema.prisma
**สาเหตุ**: เมื่อแก้ไข `schema.prisma` หลายครั้ง อาจเผลอเพิ่ม Model เดิมซ้ำลงในไฟล์มากกว่า 1 ครั้ง (เช่น `InsurancePolicyContent` ถูก append เข้าไป 2 รอบ)

**อาการ**: `npx prisma generate` ล้มเหลว ทำให้ Prisma Client ไม่รู้จัก Table ใหม่ และเกิด Error `Cannot read properties of undefined (reading 'findMany')` หรือ `(reading 'get')`

**วิธีป้องกัน**: ก่อนเพิ่ม Model ใหม่ ให้ค้นหาชื่อ Model นั้นก่อนว่ามีอยู่แล้วหรือไม่:
```bash
findstr /C:"model InsurancePolicyContent" prisma\schema.prisma
```

---

### 2. ใช้คำสั่ง Prisma ผิด
**สาเหตุ**: Prisma Client **ไม่มี** method `.get()` สำหรับดึงข้อมูลชุดเดียว

**คำสั่งที่ผิด (ห้ามใช้)**:
```js
prisma.insurancePolicyContent.get()           // ❌ ไม่มีใน Prisma
prisma.insurancePolicyContent.update({ data }) // ❌ ขาด where clause
```

**คำสั่งที่ถูกต้อง**:
```js
prisma.insurancePolicyContent.findFirst()     // ✅ ดึงแถวแรก
prisma.insurancePolicyContent.findUnique({ where: { id: 1 } }) // ✅ ดึงด้วย id
prisma.insurancePolicyContent.upsert({        // ✅ สร้างหรืออัปเดต
  where: { id: 1 },
  update: data,
  create: { ...data, id: 1 }
})
```

---

### 3. ลืม Generate Prisma Client หลังแก้ Schema
**สาเหตุ**: เมื่อเพิ่ม Model ใหม่ใน `schema.prisma` แล้ว โค้ด JavaScript ยังไม่รู้จัก Model นั้น จนกว่าจะรัน generate

**อาการ**: `prisma.insuranceCondition` มีค่าเป็น `undefined` → เรียก `.findMany()` ไม่ได้

**วิธีแก้**: หลังแก้ Schema ต้องรันเสมอ:
```bash
npx prisma generate
```

---

### 4. Server ค้างหน่วยความจำ / Nodemon ไม่ Reload
**สาเหตุ**: แม้จะแก้ไขโค้ดถูกแล้ว แต่ถ้า Server ยังรัน Prisma Client เวอร์ชันเก่าอยู่ ก็จะยัง Error เหมือนเดิม

**อาการ**: Debug log ที่เพิ่มใหม่ไม่ปรากฏใน Console Server หมายความว่า Server ไม่ได้ใช้โค้ดใหม่

**วิธีแก้**:
```bash
# 1. Kill Node ทั้งหมด
taskkill /F /IM node.exe

# 2. Generate Prisma Client ใหม่
npx prisma generate

# 3. Start Server ใหม่
npm run dev
```

---

## ขั้นตอนมาตรฐานเมื่อต้องเพิ่ม Model ใหม่

1. **ตรวจสอบว่า Model มีอยู่แล้วหรือไม่**
```bash
findstr /C:"model NameOfModel" prisma\schema.prisma
```

2. **เพิ่ม Model เข้า schema.prisma** (เพิ่มได้เพียงครั้งเดียวเท่านั้น)

3. **Sync กับฐานข้อมูล**
```bash
npx prisma db push
```

4. **Generate Prisma Client ใหม่**
```bash
npx prisma generate
```

5. **Seed ข้อมูลเริ่มต้น (ถ้ามี)**
```bash
node prisma/seed.js
```

6. **Restart Server**
```bash
taskkill /F /IM node.exe
npm run dev
```

---

## Model ที่เพิ่มในโปรเจกต์นี้ (นอกเหนือจาก schema เดิม)

| Model | Table ใน DB | ไฟล์ที่ใช้งาน |
|---|---|---|
| `InsurancePolicyContent` | `InsurancePolicyContent` | `insurance.routes.js` บรรทัด 31-52 |
| `InsuranceCondition` | `InsuranceCondition` | `insurance.routes.js` บรรทัด 57-98 |
