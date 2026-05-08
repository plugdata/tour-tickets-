# BACKOFFICE WORKFLOW OVERVIEW - ภาษาไทย

## 📊 Overview: วงจรการทำงานทั้งระบบ

```
BACKOFFICE OPERATIONS CYCLE
═══════════════════════════════════════════════════════════════════

ลูกค้า (Website)
        ↓
┌──────────────────────────────────────────────────────────────┐
│                   BACKOFFICE SYSTEM                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Trip Setup] → [Booking Manage] → [Monitor & Approve]   │
│         ↓              ↓                     ↓               │
│  [Content]     [Payment Check]       [Confirmation]         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
        ↓
ลูกค้า (Confirmation)
```

---

## 📍 WORKFLOW #1: TRIP SETUP MANAGEMENT

### วงจร: ตั้งค่าผลิตภัณฑ์ทัวร์

```
┌──────────────────────────────────────────────────────────────┐
│           1️⃣ TRIP SETUP WORKFLOW                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [1. Add Trip]                                              │
│  ├─ ชื่อ, ราคา, มัดจำ, รูป, ประเภท                         │
│  ├─ สามารถจองได้: isActive = true                           │
│  └─ เก็บ Product Base                                       │
│       ↓                                                      │
│                                                              │
│  [2. Add RoudeStack (เส้นทาง)]                             │
│  ├─ เพื่อ Trip นี้เดินทางวันไหน                            │
│  ├─ เช่น "วันศุกร์-อาทิตย์" "วันอังคาร-พฤหัส"             │
│  ├─ สำหรับทริป 3 วัน อาจมี 4-5 เส้นทาง                    │
│  └─ เก็บข้อมูลรูปแบบการเดินทาง                            │
│       ↓                                                      │
│                                                              │
│  [3. Add Bus Rounds (ตั้งเวลาเดินทาง)]                    │
│  ├─ เลือก Trip + RoudeStack                                │
│  ├─ วันเดินทาง, เวลา, จุดเริ่มต้น                          │
│  ├─ จำนวนที่นั่ง (40-50 ที่)                               │
│  ├─ ราคาเพิ่มเติม (ถ้า peak season)                       │
│  ├─ ผู้นำทัวร์, จุดรับส่ง                                  │
│  ├─ isOpen = true (รับจองได้)                             │
│  └─ ลูกค้าสามารถจองได้แล้ว! ✅                            │
│       ↓                                                      │
│                                                              │
│  [4. Add Addons (บริการเสริม)]                            │
│  ├─ Rental items: หมวก, ว่ายน้ำ, กล้องใต้น้ำ             │
│  ├─ ราคา + ระยะเวลา                                       │
│  ├─ ลูกค้าสามารถเลือกเพิ่มเติมตอนจอง                      │
│  └─ เพิ่มมูลค่า Booking                                   │
│       ↓                                                      │
│                                                              │
│  [✅ READY FOR BOOKING]                                     │
│  ลูกค้าบนเว็บไซต์เห็นและสามารถจองได้                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

🔑 KEY PAGES:
├─ trips/list.html (สร้าง + แก้ไขทริป)
├─ bus-rounds/list.html (ตั้งเวลา + รับจองเปิด/ปิด)
└─ addons/list.html (เพิ่มบริการเสริม)

📌 MAIN FUNCTION:
└─ ตั้งอะไรที่สามารถจองได้บนเว็บ
```

---

## 📍 WORKFLOW #2: BOOKING & SEAT MANAGEMENT

### วงจร: จัดการการจองและที่นั่ง

```
┌──────────────────────────────────────────────────────────────┐
│      2️⃣ BOOKING & SEAT MANAGEMENT WORKFLOW                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [5. Create Booking (บันทึกการจอง)]                       │
│  ├─ Staff รับโทรศัพท์จากลูกค้า                            │
│  ├─ เลือก: Customer + Trip + BusRound + Seats             │
│  ├─ ใส่อาหารที่แพ้                                       │
│  ├─ Status: PENDING (รอชำระเงิน)                         │
│  ├─ Price = Seats × Bus Round Price                       │
│  └─ บันทึกอัตโนมัติ ใครเป็นผู้บันทึก                      │
│       ↓                                                      │
│                                                              │
│  [6. Assign Seats (ว่างจากระบบ)]                        │
│  ├─ Staff เลือกที่นั่งจากแผนผัง                          │
│  ├─ หรือลูกค้าเลือกเอง (Website)                         │
│  ├─ SeatBooking records สร้าง                            │
│  ├─ BusRound.bookedSeats + จำนวน                        │
│  └─ ลูกค้าเห็นได้ว่า "คุณได้ที่ 15, 16"                  │
│       ↓                                                      │
│                                                              │
│  [7. Add Extra Services (หากลูกค้าเลือก)]                 │
│  ├─ Addons เพิ่มเติม (rental gear, meals)               │
│  ├─ BookingAddon records สร้าง                           │
│  ├─ Price คำนวณ += addon fees                            │
│  └─ Total Amount อัปเดต                                  │
│       ↓                                                      │
│                                                              │
│  [8. Booking Session (ธุรกรรมชั่วคราว)]                   │
│  ├─ ลูกค้า browse website ก่อนจองจริง                    │
│  ├─ System สร้าง BookingSession (cart)                   │
│  ├─ ถ้า abandon → ลบเอง (expire)                        │
│  └─ ถ้า confirm → กลายเป็น Booking                      │
│       ↓                                                      │
│                                                              │
│  [✅ BOOKING CREATED]                                      │
│  ลูกค้ารู้ว่าต้องจ่ายเงิน + ปลายทาง                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

🔑 KEY PAGES:
├─ bookings/list.html (ดูการจองทั้งหมด + filter)
├─ bookings/view.html (ดูรายละเอียด)
├─ booking/form.html (สร้างการจองใหม่)
└─ booking/seats.html (เลือกที่นั่ง + แผนผัง)

📌 MAIN FUNCTION:
└─ บันทึกว่าลูกค้าจองที่นั่งไหน กี่ที่ ราคาเท่าไร
```

---

## 📍 WORKFLOW #3: PAYMENT & FINANCIAL

### วงจร: ตรวจสอบและอนุมัติการชำระเงิน

```
┌──────────────────────────────────────────────────────────────┐
│         3️⃣ PAYMENT & FINANCIAL WORKFLOW                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [9. Upload Payment Slip (ลูกค้า)]                        │
│  ├─ ลูกค้าโอนเงินไปบัญชี (Online/ATM)                    │
│  ├─ ลูกค้าถ่ายรูปสลิป + อัพโหลดบนเว็บ                    │
│  ├─ Payment record สร้าง                                  │
│  ├─ Payment.slipUrl = รูปสลิป                           │
│  ├─ Payment.status = PENDING (รอยืนยัน)                │
│  └─ Staff ทำงานอื่นอยู่ เดี๋ยวก่อน                      │
│       ↓                                                      │
│                                                              │
│  [10. Verify Payment (Staff ตรวจสอบ)]                   │
│  ├─ Staff เข้า: payments/list.html                       │
│  ├─ ดูรูปสลิป                                            │
│  ├─ Checklist:                                           │
│  │  ✓ Amount = Booking.totalAmount                     │
│  │  ✓ Bank Account = ของ Company                       │
│  │  ✓ Transfer Date = ล่าสุด (ไม่เก่า)                │
│  │  ✓ Slip clear + มี Transaction ID                  │
│  └─ ลงแล้ว? → APPROVE Payment                          │
│       ↓                                                      │
│                                                              │
│  [11. Payment Verified (ยืนยันแล้ว)]                     │
│  ├─ Payment.status = VERIFIED                           │
│  ├─ Payment.verifiedBy = Staff name                     │
│  ├─ Payment.verifiedDate = now                          │
│  ├─ ขณะนี้: เงินถูก verify แล้ว                         │
│  └─ Staff สามารถอนุมัติ Booking ได้                     │
│       ↓                                                      │
│                                                              │
│  [12. Check Insurance (เพิ่มเติม)]                       │
│  ├─ ลูกค้ากรอก Insurance Form หรือยัง?                 │
│  ├─ (ถ้าต้อง)                                          │
│  └─ OK → ไปต่อ APPROVAL                                 │
│       ↓                                                      │
│                                                              │
│  [✅ PAYMENT ACCEPTED]                                    │
│  เงินรับแล้ว เตรียมอนุมัติ                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘

🔑 KEY PAGES:
├─ payments/list.html (ตรวจสอบสลิป)
├─ bookmoney/bookmoney.html (ติดตามเงินรับ)
├─ insurance/form.html (ประกัน)
└─ bank-accounts.html (บัญชีบริษัท)

📌 MAIN FUNCTION:
└─ เช็คว่าลูกค้าจ่ายเงินจริง + จำนวนเท่ากับเท่าไร
```

---

## 📍 WORKFLOW #4: MONITORING & APPROVAL

### วงจร: ตรวจสอบทั้งหมด + อนุมัติการจอง

```
┌──────────────────────────────────────────────────────────────┐
│      4️⃣ MONITORING & APPROVAL WORKFLOW                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [13. Dashboard Check (Overview)]                          │
│  ├─ ดู: Pending Approvals (กี่รายการ)                    │
│  ├─ ดู: Today's Revenue (ขายได้เท่าไร)                   │
│  ├─ ดู: Recent Activities (เกิดอะไรบ้าง)                 │
│  └─ ระบายสกปรกไป APPROVAL หน้า                          │
│       ↓                                                      │
│                                                              │
│  [14. Review Booking (ตรวจสอบครบถ้วน)]                   │
│  ├─ Staff: Bookings/View.html                           │
│  ├─ เช็ก: Payment VERIFIED ✓                            │
│  ├─ เช็ก: Insurance OK ✓                                │
│  ├─ เช็ก: Seats ยังว่างอยู่ ✓                           │
│  ├─ เช็ก: ลูกค้าหรือสมาชิก ✓                            │
│  └─ ทั้งหมด OK → ไปต่อ APPROVE                          │
│       ↓                                                      │
│                                                              │
│  [15. Final Approval (อนุมัติสุดท้าย)]                     │
│  ├─ Booking.status = CONFIRMED                          │
│  ├─ SeatBooking สร้าง (assign seat numbers)            │
│  ├─ BusRound.bookedSeats update                        │
│  ├─ ระบบส่ง Email ให้ลูกค้า:                           │
│  │  "ยืนยันการจอง ... วันเดินทาง ..."                   │
│  └─ ลูกค้าเตรียมตัวไป tour                              │
│       ↓                                                      │
│                                                              │
│  [16. OR: Reject Booking (หากปัญหา)]                    │
│  ├─ ถ้า slipไม่ตรงตัวจำนวน → REJECT                   │
│  ├─ Booking.status = CANCELLED                         │
│  ├─ ส่ง Email ให้ลูกค้า: "ขออภัย ..."                  │
│  ├─ Refund process เริ่มต้น                            │
│  └─ ลูกค้าอัพโหลดสลิปใหม่                               │
│       ↓                                                      │
│                                                              │
│  [17. Follow-up (ติดตามก่อนเดินทาง)]                      │
│  ├─ 7 วันก่อน: โทรเตือนลูกค้า                           │
│  ├─ 3 วันก่อน: ส่ง Itinerary                           │
│  ├─ 1 วันก่อน: เตรียมรถ/ไกด์                           │
│  └─ วันเดินทาง: ยืนยันลูกค้ามา                         │
│       ↓                                                      │
│                                                              │
│  [✅ BOOKING CONFIRMED]                                    │
│  ลูกค้าพร้อม ไป tour ได้                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

🔑 KEY PAGES:
├─ dashboard.html (ดู KPI + pending)
├─ bookings/list.html (ดูการจองทั้งหมด)
├─ bookings/view.html (ตรวจสอบเพิ่มเติม)
└─ monitor/list.html (activity logs)

📌 MAIN FUNCTION:
└─ ตัดสินใจ APPROVE หรือ REJECT การจอง
```

---

## 📍 WORKFLOW #5: CONTENT MANAGEMENT

### วงจร: จัดการเนื้อหาเว็บไซต์

```
┌──────────────────────────────────────────────────────────────┐
│      5️⃣ CONTENT MANAGEMENT WORKFLOW                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [18. Website Settings (ตั้งค่าทั่วไป)]                   │
│  ├─ ชื่อเว็บ, โลโก้, ที่อยู่, เบอร์โทร                     │
│  ├─ Terms & Conditions                                    │
│  ├─ Bank Account ที่แสดงบนเว็บ                           │
│  └─ Setting global สำหรับทั้งเว็บ                         │
│       ↓                                                      │
│                                                              │
│  [19. Upload Gallery Images (รูปภาพ)]                     │
│  ├─ รูปชายหาด, ภูเขา, โรงแรม ฯลฯ                        │
│  ├─ Title + Description                                  │
│  ├─ Set Display Order (อันไหนแสดงก่อน)                  │
│  ├─ Activate/Deactivate                                 │
│  └─ ลูกค้าเห็นรูปสวยขึ้น                                  │
│       ↓                                                      │
│                                                              │
│  [20. Create Content Pages (หน้าข้อมูล)]                 │
│  ├─ About Us, FAQ, Privacy, Terms                       │
│  ├─ Title + Slug (URL)                                  │
│  ├─ Rich Text Editor (ลองทำได้)                         │
│  ├─ Publish/Draft status                                │
│  ├─ เลื่อน: featured image                              │
│  └─ Publish → ขึ้นเว็บแล้ว                               │
│       ↓                                                      │
│                                                              │
│  [✅ WEBSITE UPDATED]                                      │
│  ลูกค้าเห็นเนื้อหา/รูปใหม่ บนหน้าเว็บ                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘

🔑 KEY PAGES:
├─ cms/settings.html (ตั้งค่าเว็บ)
├─ cms/gallery.html (อัพโหลดรูป)
└─ contents/list.html (สร้างหน้า)

📌 MAIN FUNCTION:
└─ อัปเดตเนื้อหาเว็บ เพื่อให้ลูกค้าเห็นข้อมูลใหม่
```

---

## 📍 WORKFLOW #6: REPORTING & ANALYTICS

### วงจร: สร้างรายงานและติดตามผลการขาย

```
┌──────────────────────────────────────────────────────────────┐
│      6️⃣ REPORTING & ANALYTICS WORKFLOW                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [21. Daily Report (ประจำวัน)]                            │
│  ├─ ยอดจอง, ยอดขาย, pending approvals                    │
│  ├─ Staff standup: อภิปรายเรื่องวันนี้                   │
│  └─ Adjust strategy if needed                            │
│       ↓                                                      │
│                                                              │
│  [22. Monthly Report (ประจำเดือน)]                        │
│  ├─ Total Bookings, Revenue, Cancellation Rate          │
│  ├─ Trip Performance (ไหนขายดี/เสีย)                    │
│  ├─ Customer Analysis (ลูกค้าใหม่ vs เก่า)               │
│  ├─ Report ส่งให้ owner/manager                         │
│  └─ Planning สำหรับเดือนหน้า                            │
│       ↓                                                      │
│                                                              │
│  [23. Staff Performance (ผลการทำงาน)]                     │
│  ├─ Bookings ที่บันทึก                                  │
│  ├─ Success Rate (approve%)                             │
│  ├─ Commission calculation                              │
│  └─ Performance review + feedback                       │
│       ↓                                                      │
│                                                              │
│  [24. Expense Tracking (ค่าใช้จ่าย)]                      │
│  ├─ Fuel, Accommodation, Maintenance                    │
│  ├─ Budget vs Actual                                    │
│  ├─ Category Analysis                                   │
│  └─ Cost Optimization                                   │
│       ↓                                                      │
│                                                              │
│  [✅ INSIGHTS & DECISION MAKING]                           │
│  Manager ตัดสินใจ: เพิ่มทริป? ปรับราคา? ลดค่าใช้จ่าย?  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

🔑 KEY PAGES:
├─ dashboard.html (KPI overview)
├─ reports/summary.html (daily/monthly)
├─ reports/staff-report.html (performance)
├─ expenses/list.html (cost tracking)
└─ monitor/list.html (activity logs)

📌 MAIN FUNCTION:
└─ วิเคราะห์ข้อมูล เพื่อ optimize business
```

---

## 🔄 COMPLETE CYCLE: ตั้งแต่ต้นจนจบ

```
DAY 1-30: SETUP PHASE
══════════════════════════════════════════════
 [1] Add Trip
    ↓
 [2] Add RoudeStack
    ↓
 [3] Add Bus Rounds (ลูกค้าสามารถจองได้)
    ↓
 [4] Add Addons
    ↓
 [18] Website Settings
    ↓
 [19-20] Content & Gallery
    ✓ Website พร้อม!

WHEN CUSTOMER COMES IN
═════════════════════════════════════════════
 [5] Create Booking (Staff)
    ↓
 [6-7] Assign Seats & Addons
    ↓
 [9] Customer Upload Slip
    ↓
 [10-11] Verify Payment
    ↓
 [12] Check Insurance
    ↓
 [14-15] Final Approval
    ↓
 [17] Follow-up & Trip
    ✓ Booking Complete!

EVERY MONTH
═════════════════════════════════════════════
 [21] Daily Reports
 [22] Monthly Reports
 [23] Staff Performance
 [24] Expense Tracking
    ↓
 [Manager Decision Making]
```

---

## 📋 SUMMARY: หน้าที่ของแต่ละ Workflow

| # | Workflow | หน้าที่หลัก | Output |
|---|----------|-----------|--------|
| 1 | Trip Setup | ตั้งสินค้าให้ลูกค้าเลือก | ทริปพร้อมจอง ✅ |
| 2 | Booking | บันทึกว่าใครจองอะไร | Booking record |
| 3 | Payment | เช็คว่าจ่ายเงินจริง | Payment verified |
| 4 | Approval | ตัดสินใจอนุมัติ | Booking confirmed |
| 5 | Content | อัปเดตเว็บ | Website updated |
| 6 | Reporting | วิเคราะห์ผล | Insights & Decision |

---

## 🎯 ไหลของข้อมูล (Data Flow)

```
ลูกค้า (Website)
    ↓
[Booking Session] (รหัสอ้างอิง)
    ↓
[Booking Entry] (บันทึกถูก)
    ↓
[Seat Selection] (ที่นั่งถูกเลือก)
    ↓
[Insurance Form] (ประกันเลือก)
    ↓
[Payment Slip Upload] (สลิปอัพโหลด)
    ↓
[BACKOFFICE]
    ├─ [Verify Payment] (เช็คเงิน)
    ├─ [Review All Data] (ตรวจสอบ)
    └─ [Final Approval] (อนุมัติ)
    ↓
[Admin Approval] ✅ CONFIRMED
    ↓
[Confirmation Email/SMS]
    ↓
ลูกค้า (ได้ยืนยัน ไป Tour ได้!)
```

---

## 📌 KEY TAKEAWAYS

✅ **ทั้ง 6 Workflow เชื่อมต่อกัน**:
- Trip Setup → ให้เลือก
- Booking → บันทึก
- Payment → เช็คเงิน
- Approval → อนุมัติ
- Content → แสดงเว็บ
- Reporting → วิเคราะห์

✅ **หน้าที่หลัก**:
1. **Manager**: Setup trips + Approve bookings + Monitor
2. **Backoffice**: Verify payment + Final check + Follow-up
3. **Customer Service**: Take booking + Explain price + Track status
4. **Content Team**: Update website + Gallery + Pages

✅ **ทั้งหมดเชื่อมตั้งแต่ลูกค้ามา จนกว่าจะจบทัวร์**

นี่คือ Workflow ทั้งหมดของระบบ! 🎉
