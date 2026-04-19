---
description: บันทึกการพัฒนาระบบ Backoffice Admin - Pagination, Payment, Bus Rounds, และการแก้ไข UI
---

# บันทึกการพัฒนา Backoffice Admin Enhancements
> Conversation ID: `2dfb6481-4b1f-4fda-8168-070a65238d11`
> วันที่: 2026-04-18 ถึง 2026-04-19

---

## โครงสร้างโปรเจกต์

```
d:\project_ticket\
├── backend\
│   ├── prisma\
│   │   └── schema.prisma        # Prisma ORM Schema (PostgreSQL)
│   └── src\
│       └── routes\
│           ├── busRound.routes.js
│           ├── payment.routes.js
│           └── ...
└── frontend\
    ├── assets\
    │   └── js\
    │       ├── i18n.js           # ฟังก์ชัน t() สำหรับ translation
    │       └── features\
    │           └── file-upload.js
    ├── modules\
    │   └── PaginationManager.js  # Module แบ่งหน้าข้อมูล
    └── pages\
        ├── trips\list.html
        ├── addons\list.html
        ├── payments\list.html
        ├── insurance\list.html
        ├── bus-rounds\list.html
        └── booking\
            ├── form.html
            └── insurance.html
```

---

## 1. การใช้งาน PaginationManager.js

### ปัญหาที่พบ
- Path ผิด: `../../frontend/modules/PaginationManager.js` → ควรเป็น `../../modules/PaginationManager.js`
- ต้องโหลด `i18n.js` ก่อน PaginationManager เพราะใช้ฟังก์ชัน `t()`

### Pattern การใช้งาน (Client-side Pagination)

```html
<!-- HTML: เพิ่ม Pagination Container -->
<div class="card-footer bg-white border-top-0">
    <div id="myPagination"></div>
</div>

<!-- Script Tags (ลำดับสำคัญ!) -->
<script src="../../assets/js/i18n.js"></script>
<script src="../../assets/js/auth.js"></script>
<script src="../../assets/js/apiClient.js"></script>
<script src="../../modules/PaginationManager.js"></script>
<script src="../../assets/js/app.js"></script>
```

```javascript
// JS: ตัวแปร Global
let pagination;
let currentPage = 1, perPage = 10, filteredData = [];

// Init ใน DOMContentLoaded
pagination = new PaginationManager({
    containerId: 'myPagination',
    onPageChange: (p) => { currentPage = p; renderData(false); },
    onPerPageChange: (pp) => { perPage = pp; currentPage = 1; renderData(false); }
});

// Load Data
async function loadData() {
    let data = await API.something.list();
    filteredData = data; // กรองข้อมูลก่อนถ้าจำเป็น
    currentPage = 1;
    renderData();
}

// Render แบ่งหน้า
function renderData(resetPage = true) {
    if (resetPage) currentPage = 1;
    
    // กรองข้อมูล...
    filteredData = allData.filter(...);
    
    if (!filteredData.length) {
        tbody.innerHTML = '<tr><td colspan="N" class="text-center py-4 text-muted">ไม่พบข้อมูล</td></tr>';
        pagination.render({ totalRecords: 0, currentPage, perPage });
        return;
    }
    
    const startIdx = (currentPage - 1) * perPage;
    const pagedData = filteredData.slice(startIdx, startIdx + perPage);
    
    tbody.innerHTML = pagedData.map((item, i) => `
        <tr>
            <td>${startIdx + i + 1}</td>
            <!-- ... -->
        </tr>
    `).join('');
    
    pagination.render({ totalRecords: filteredData.length, currentPage, perPage });
}
```

### หน้าที่ได้รับการเพิ่ม Pagination
- `pages/trips/list.html` → `tripPagination` (perPage ค่าเริ่มต้น 10)
- `pages/addons/list.html` → `addonPagination` (perPage ค่าเริ่มต้น 10)
- `pages/payments/list.html` → `paymentPagination` (perPage ค่าเริ่มต้น 10)
- `pages/insurance/list.html` → `insurancePagination` (perPage ค่าเริ่มต้น 10)
- `pages/bus-rounds/list.html` → `roundPagination` (perPage ค่าเริ่มต้น **9** เพราะ Card Layout 3 คอลัมน์)

---

## 2. Payment List - การดึงข้อมูลลูกค้า

### ปัญหา
- ระบบเดิมดึงข้อมูลจาก `booking.user` (ผู้จอง) ซึ่งอาจไม่ใช่ผู้เดินทางตัวจริง

### วิธีแก้ไข (buildCustomerCell function)

Priority การดึงข้อมูลชื่อลูกค้า:
1. **SeatBooking** (ผู้เดินทางจริง) ← ดึงก่อน
2. **InsuranceForm** (ฟอร์มประกัน) ← ถ้าไม่มี SeatBooking
3. **User Account** (ผู้จอง) ← ถ้าไม่มีข้อมูลทั้งสอง

### Backend ต้องแก้ (`payment.routes.js`)
```javascript
// ต้อง include seatBookings ใน booking
include: {
    booking: {
        include: {
            busRound: { include: { trip: true } },
            user: true,
            seatBookings: true  // ← เพิ่มตรงนี้
        }
    }
}
```

---

## 3. Bus Rounds List - Card Layout

### การแสดงผล Pickup Points
- จุดรับจุดแรก (startPoint) แสดงด้วยสี Primary
- จุดรับเพิ่มเติม (ถ้ามีมากกว่า 1) แสดงเป็น List ย่อยใต้จุดแรก

```javascript
// ใน renderRounds: แสดง pickup points
`<div class="mb-1 text-primary small fw-bold">
    <i class="bi bi-geo-alt-fill me-1"></i>${r.startPoint}
</div>
${r.pickupPoints && r.pickupPoints.length > 1 ? `
    <div class="mb-2 ps-2 border-start text-muted" style="font-size: 0.75rem;">
        ${r.pickupPoints.slice(1).map(p => `
            <div class="mb-1">
                <i class="bi bi-plus-circle me-1"></i>${p.name}
                ${p.price > 0 ? `<span class="text-success fw-bold">+${p.price}</span>` : ''}
            </div>
        `).join('')}
    </div>
` : ''}`
```

### Bus Round - Sort by Latest Updated

**Schema ที่ต้องเพิ่ม:** (`schema.prisma`)
```prisma
model BusRound {
  // ...
  createdAt   DateTime @default(now())
  updatedAt   DateTime @default(now()) @updatedAt  // ← ต้องมี @default(now())
}
```

> ⚠️ **สำคัญ**: ต้องใส่ `@default(now())` ด้วย มิฉะนั้น `prisma db push` จะขอให้ยืนยัน (เพราะข้อมูลเดิมในฐานข้อมูลไม่มีฟิลด์นี้)

**API Route:** (`busRound.routes.js`)
```javascript
const rounds = await prisma.busRound.findMany({
    include: { trip: true, _count: { ... } },
    orderBy: { updatedAt: 'desc' }  // ← เรียงล่าสุดก่อน
})
```

**ผลลัพธ์**: เมื่อแก้ไขหรือเพิ่มรอบรถใหม่ Card จะขึ้นมาด้านบนสุดอัตโนมัติ

---

## 4. Booking Form - Blood Type

### การแก้ไข (`pages/booking/form.html`)
- เปลี่ยนจาก A+, A-, B+, B-, AB+, AB-, O+, O-
- เป็น **A, B, AB, O** (ตัดกลุ่ม Rh factor ออก)

```html
<select class="form-select form-select-sm passenger-bloodtype">
    <option value="">-</option>
    <option>A</option>
    <option>B</option>
    <option>AB</option>
    <option>O</option>
</select>
```

---

## 5. Navigation - goBack()

### แก้ไขใน Booking Pages
ทั้ง `booking/form.html` และ `booking/insurance.html`:
```javascript
function goBack() {
    window.location.href = '/frontend/pages/bus-rounds/list.html';
}
```

---

## 6. Trip Management - เพิ่ม Deposit และ Document

### Schema (`schema.prisma`)
```prisma
model Trip {
  // ...
  deposit   Float   @default(0)  // เงินมัดจำ
  docUrl    String?              // ลิงก์เอกสารอธิบาย
}
```

### UI Form Fields
```html
<!-- เงินมัดจำ -->
<input type="number" id="fDeposit" min="0" step="0.01" value="0">

<!-- Upload เอกสาร PDF/Word -->
<div id="docUploadContainer"></div>
<input type="hidden" id="fDocUrl">
```

### Init FileUpload สำหรับ Document
```javascript
FileUpload.init('#docUploadContainer', {
    targetInputId: 'fDocUrl',
    multiple: false,
    btnText: 'เลือกไฟล์อธิบาย',
    btnIcon: 'bi-file-earmark-text',
    allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/html'
    ]
});
```

---

## 7. ปัญหาที่พบและวิธีแก้ไข

| ปัญหา | สาเหตุ | วิธีแก้ |
|-------|---------|---------|
| PaginationManager not defined | Path ผิด `../../frontend/modules/...` | เปลี่ยนเป็น `../../modules/...` |
| Error 500: Column updatedAt not found | `prisma db push` ยังไม่ได้รัน | รัน `npx prisma db push` และพิมพ์ `y` เพื่อยืนยัน |
| db push ล้มเหลว (data loss warning) | ฟิลด์ใหม่ไม่มี default value | เพิ่ม `@default(now())` ก่อน `@updatedAt` |
| รายการไม่ Refresh หลังแก้ไข | Sort order ไม่เปลี่ยน | เพิ่ม `orderBy: { updatedAt: 'desc' }` ใน Prisma query |
| i18n.js ต้องโหลดก่อน | PaginationManager ใช้ฟังก์ชัน `t()` | โหลด `i18n.js` ก่อน `PaginationManager.js` เสมอ |

---

## 8. คำสั่งที่ใช้บ่อย

```bash
# อัปเดต Schema และฐานข้อมูล
cd d:\project_ticket\backend
npx prisma generate
npx prisma db push

# รัน Backend Server
npm run dev

# Push GitHub
git add .
git commit -m "feat: description"
git push origin main
```

---

## 9. Stack เทคโนโลยี

- **Database**: PostgreSQL + Prisma ORM
- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML + Bootstrap 5.3.2 + Bootstrap Icons
- **Font**: Sarabun (Google Fonts) สำหรับ Thai Text
- **Key Modules**: PaginationManager.js, FileUpload.js (instance-based), i18n.js

---

## 10. API Endpoints ที่เกี่ยวข้อง

| Endpoint | Method | หมายเหตุ |
|----------|--------|---------|
| `/api/bus-rounds` | GET | ดึงรอบรถทั้งหมด (sort by updatedAt desc) |
| `/api/bus-rounds/trip/:id` | GET | ดึงรอบรถตาม Trip |
| `/api/bus-rounds/:id` | PUT | แก้ไขรอบรถ |
| `/api/bus-rounds/:id/toggle` | PATCH | เปิด/ปิดการจอง |
| `/api/payments` | GET | ดึงรายการชำระเงิน (ต้อง include seatBookings) |
| `/api/trips` | GET/POST/PUT/DELETE | จัดการ Trip |
| `/api/addons` | GET/POST/PUT/DELETE | จัดการ Addon |
| `/api/insurance` | GET | ดึงฟอร์มประกัน |
