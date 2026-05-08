# Eraser.io Diagram Guide - Project Ticket Booking System

## 📋 Diagram Structure & Content

---

## 1️⃣ SYSTEM ARCHITECTURE DIAGRAM

### Diagram Type: C4 Architecture / Cloud Icons

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├─────────────────────┬───────────────────┬──────────────────┤
│ Customer Website    │ Backoffice Admin  │ Mobile Admin     │
│ (Vite + Vanilla JS) │ (HTML + Vanilla)  │ (Future)         │
│                     │                   │                  │
│ - Home/Landing      │ - Dashboard       │                  │
│ - Trip Search       │ - Bookings        │                  │
│ - Seat Selection    │ - Payments        │                  │
│ - Booking Form      │ - Reports         │                  │
│ - Insurance Form    │ - CMS             │                  │
│ - Payment Upload    │ - Users           │                  │
│ - Status Check      │ - Settings        │                  │
└──────┬──────────────┴────────┬──────────┴──────────────────┘
       │                       │
       └───────────┬───────────┘
                   ↓
        ┌──────────────────────┐
        │   API GATEWAY / AUTH  │
        │  (JWT Middleware)     │
        └──────────┬────────────┘
                   ↓
   ┌───────────────────────────────────────┐
   │      BACKEND API LAYER (Express)      │
   ├─────────────────────────────────────┤
   │  27 REST Endpoints (see detail #2)  │
   │                                     │
   │  ✓ Stateless                        │
   │  ✓ Can be load-balanced             │
   │  ✓ Swagger API docs at /api-docs    │
   └──────────────┬──────────────────────┘
                  ↓
   ┌──────────────────────────────────────┐
   │    DATA LAYER (PostgreSQL)           │
   ├──────────────────────────────────────┤
   │  Prisma ORM                          │
   │  - 14 Core Models                    │
   │  - Migrations tracked                │
   │  - Seed data available               │
   └──────────────────────────────────────┘

EXTERNAL INTEGRATIONS:
├─ Email Service (Confirmation, Refund)
├─ SMS Gateway (Notifications)
├─ Payment Gateway (Verification)
└─ File Storage (Slip uploads, Images)
```

---

## 2️⃣ API ENDPOINTS STRUCTURE DIAGRAM

### Diagram Type: Mind Map / Hierarchical

```
/api (27 Endpoints)
│
├─ Auth & Users (5)
│  ├─ POST   /api/auth/login
│  ├─ POST   /api/auth/register
│  ├─ GET    /api/users
│  ├─ POST   /api/users
│  └─ GET    /api/users/:id
│
├─ Trips & Routes (3)
│  ├─ GET    /api/trips
│  ├─ POST   /api/trips
│  └─ GET    /api/roudestack
│
├─ Bus Management (4)
│  ├─ GET    /api/bus-rounds
│  ├─ POST   /api/bus-rounds
│  ├─ GET    /api/bus-rounds/draft
│  └─ PATCH  /api/bus-rounds/:id
│
├─ Bookings & Sessions (3)
│  ├─ GET    /api/bookings
│  ├─ POST   /api/bookings
│  ├─ GET    /api/booking-sessions
│  └─ GET    /api/seat-bookings
│
├─ Payments & Finance (4)
│  ├─ GET    /api/payments
│  ├─ POST   /api/payments
│  ├─ GET    /api/bank-accounts
│  └─ GET    /api/expenses
│
├─ Products & Services (3)
│  ├─ GET    /api/addons
│  ├─ POST   /api/addons
│  └─ PATCH  /api/addons/:id
│
├─ Insurance (2)
│  ├─ GET    /api/insurance
│  └─ POST   /api/insurance
│
├─ CMS & Content (4)
│  ├─ GET    /api/contents
│  ├─ GET    /api/gallery
│  ├─ GET    /api/settings
│  └─ PATCH  /api/settings/:key
│
└─ Utilities (2)
   ├─ POST   /api/uploads
   └─ GET    /api/reports
```

---

## 3️⃣ DATABASE ENTITY RELATIONSHIP DIAGRAM

### Diagram Type: ER Diagram

```
USERS & AUTH
┌──────────────────┐
│      User        │ enum Role {ADMIN, STUFF, CUSTOMER}
├──────────────────┤
│ id (PK)          │
│ username (UNIQUE)│
│ password         │
│ role             │
│ name, phone      │
│ email, createdAt │
└────┬──────────────┘
     │ 1:N
     └─→ Booking, Payment

FINANCE
┌──────────────────────┐
│    BankAccount       │
├──────────────────────┤
│ id (PK)              │
│ accountNo (UNIQUE)   │
│ accountName, bankName│
│ accountType          │
│ qrCodeUrl, isActive  │
└──────────────────────┘

┌──────────────────────┐
│      Payment         │
├──────────────────────┤
│ id (PK)              │
│ bookingId (FK)       │
│ userId (FK)          │
│ amount, slipUrl      │
│ status, verifiedBy   │
│ verifiedDate         │
└──────────────────────┘

CORE BOOKING
┌──────────────────┐
│      Trip        │ ← Main product
├──────────────────┤
│ id (PK)          │
│ title, description
│ price, deposit   │
│ imageUrl         │
│ tripType (DOMESTIC)
│ isHot, hotOrder  │
└────┬──────────────┘
     │ 1:N
     ├─→ RoudeStack (multi-day routes)
     │    │ 1:N
     │    └─→ BusRound (specific departures)
     │         │ 1:N
     │         └─→ Booking
     │              │ 1:N
     │              └─→ SeatBooking (individual seats)
     │
     ├─→ Addon (rental items)
     │    │ M:N through BookingAddon
     │    └─→ Booking
     │
     └─→ Content (CMS pages)

┌──────────────────────────┐
│   RoudeStack             │
├──────────────────────────┤
│ id (PK)                  │
│ tripId (FK)              │
│ roundname, departDate    │
└────┬─────────────────────┘
     │ 1:N
     └─→ BusRound

┌──────────────────────────┐
│    BusRound              │ ← Specific departure
├──────────────────────────┤
│ id (PK)                  │
│ tripId (FK)              │
│ roudeStackId (FK)        │
│ busNumber, startPoint    │
│ departDate, totalSeats   │
│ bookedSeats, duration    │
│ extraPrice, isOpen       │
│ pickupPoints (JSON)      │
└────┬─────────────────────┘
     │ 1:N
     ├─→ Booking
     │    └─→ Booking has 1:1 Payment, 1:N BookingAddon
     │
     └─→ SeatBooking

┌──────────────────────────┐
│    Booking               │ ← Customer booking record
├──────────────────────────┤
│ id (PK)                  │
│ userId (FK)              │ enum BookingStatus
│ busRoundId (FK)          │ {PENDING, CONFIRMED, CANCELLED}
│ seats, bookingType       │
│ foodAllergy              │
│ status                   │
│ totalAmount, recordedBy  │
│ createdAt, updatedAt     │
└────┬──────────────────────┘
     │ 1:N
     ├─→ SeatBooking
     │
     ├─→ BookingAddon (M:N with Addon)
     │
     ├─→ Payment (1:1)
     │
     └─→ InsuranceForm

┌──────────────────────────┐
│   SeatBooking            │ ← Individual seat
├──────────────────────────┤
│ id (PK)                  │
│ bookingId (FK)           │
│ busRoundId (FK)          │
│ seatNumber               │
│ status                   │
└──────────────────────────┘

┌──────────────────────────┐
│   BookingAddon           │ ← Add-on items
├──────────────────────────┤
│ id (PK)                  │
│ bookingId (FK)           │
│ addonId (FK)             │
│ quantity, price          │
│ totalPrice               │
└──────────────────────────┘

┌──────────────────────────┐
│    Addon                 │
├──────────────────────────┤
│ id (PK)                  │
│ tripId (FK)              │
│ name, description        │
│ price, duration          │
└──────────────────────────┘

INSURANCE
┌──────────────────────────┐
│   InsuranceForm          │
├──────────────────────────┤
│ id (PK)                  │
│ bookingId (FK)           │
│ insuranceId (FK)         │
│ customerName, age        │
│ idCard                   │
│ conditions (JSON array)  │
└──────────────────────────┘

CMS & OPERATIONS
┌──────────────────────────┐
│    Content               │
├──────────────────────────┤
│ id (PK)                  │
│ tripId (FK)              │
│ title, body              │
│ slug, imageUrl           │
└──────────────────────────┘

┌──────────────────────────┐
│   SiteSetting            │
├──────────────────────────┤
│ id (PK)                  │
│ key (UNIQUE)             │
│ value, description       │
└──────────────────────────┘

┌──────────────────────────┐
│    Expense               │
├──────────────────────────┤
│ id (PK)                  │
│ date, description        │
│ amount, category         │
│ createdBy                │
└──────────────────────────┘
```

---

## 4️⃣ BOOKING WORKFLOW FLOWCHART

### Diagram Type: Flowchart / Sequence Diagram

```
CUSTOMER BOOKING JOURNEY (Website)
═══════════════════════════════════════════════

  Customer
     │
     ├─→ Homepage / Search Trips
     │      ↓
     ├─→ Select Trip
     │      ↓
     ├─→ Booking Session Created
     │   (BookingSession record)
     │      ↓
     ├─→ Select Seats
     │   (SeatBooking records created)
     │      ↓
     ├─→ Fill Booking Form
     │   (Booking record created)
     │   - Passenger info
     │   - Food allergies
     │   - Quantity selection
     │      ↓
     ├─→ Fill Insurance Form
     │   (InsuranceForm record)
     │      ↓
     ├─→ Upload Payment Slip
     │   (Payment.slipUrl)
     │   Status: PENDING
     │      ↓
     └─→ Wait for Admin Review
         (Check booking status page)


ADMIN APPROVAL WORKFLOW (Backoffice)
═══════════════════════════════════════════════

  Admin Review Page (payments/list.html)
     │
     ├─→ View Pending Bookings
     │      ↓
     ├─→ Verify Payment Slip
     │   - Amount matches totalAmount
     │   - Bank account correct
     │   - Date recent
     │      ↓
     ├─→ Check Seat Availability
     │   (Verify bookedSeats < totalSeats)
     │      ↓
     ├─→ Review Insurance Form
     │      ↓
     ├─→ Make Decision
     │   │
     │   ├─→ [APPROVE]
     │   │      ↓
     │   │   Update Booking.status = CONFIRMED
     │   │   Set Payment.verifiedBy = admin name
     │   │   Set Payment.verifiedDate = now
     │   │      ↓
     │   │   Send Confirmation Email/SMS
     │   │      ↓
     │   │   Customer Receives Confirmation
     │   │
     │   └─→ [REJECT]
     │      │
     │      ├─→ Update Booking.status = CANCELLED
     │      ├─→ Create CancelLog (reason)
     │      ├─→ Unlock SeatBookings
     │      ├─→ Process Refund
     │      └─→ Send Rejection Email/SMS


STATUS TRACKING
═══════════════════════════════════════════════

Booking.status Flow:
├─ PENDING (waiting for admin approval)
├─ CONFIRMED (approved, ready for trip)
└─ CANCELLED (rejected or customer cancelled)

Payment.status Flow:
├─ PENDING (slip uploaded, awaiting verification)
├─ VERIFIED (admin approved)
└─ REJECTED (slip invalid, need resubmit)
```

---

## 5️⃣ BACKOFFICE PAGE STRUCTURE DIAGRAM

### Diagram Type: Hierarchical Tree / Component Map

```
BACKOFFICE ADMIN PANEL
│
├─📊 DASHBOARD
│  └─ Overview, KPIs, Recent Bookings
│
├─📋 BOOKING MANAGEMENT
│  ├─ Bookings List (list.html)
│  │  └─ Filter by status, date, customer
│  ├─ Booking Detail View (view.html)
│  ├─ Manual Booking Entry (form.html)
│  ├─ Seat Plan (seats.html)
│  │  └─ Visual seat layout, click to manage
│  └─ Booking Status Tracker (status.html)
│
├─🚌 TRIP & BUS MANAGEMENT
│  ├─ Trips (trips/list.html)
│  │  └─ Create, edit, mark hot, enable/disable
│  ├─ Bus Rounds (bus-rounds/list.html)
│  │  ├─ Schedule departures
│  │  ├─ Set seats, pricing
│  │  └─ View booked vs available seats
│  ├─ Draft Bus Rounds
│  │  └─ Create rounds before publishing
│  └─ Add-ons (addons/list.html)
│     └─ Rental items, prices, durations
│
├─💳 PAYMENT & FINANCIAL
│  ├─ Payments (payments/list.html)
│  │  ├─ View payment records
│  │  ├─ Verify payment slips
│  │  └─ Approve/reject
│  ├─ Money Received (bookmoney/bookmoney.html)
│  │  └─ Track received amounts by date
│  ├─ Bank Transfers (bookmoney/bookbank.html)
│  │  └─ Transfer tracking
│  └─ Bank Accounts (admin/bank-accounts.html)
│     └─ Add accounts, set QR codes
│
├─🛡️ INSURANCE MANAGEMENT
│  ├─ Insurance Forms (insurance/form.html)
│  │  └─ Form template management
│  ├─ Policies (insurance/list.html)
│  │  └─ Policy management
│  ├─ Conditions (insurance/conditions.html)
│  │  └─ Terms & conditions text
│  └─ Customer Forms (insurance/customer-form.html)
│     └─ View customer submissions
│
├─👥 CUSTOMER MANAGEMENT
│  ├─ Customers (customers/list.html)
│  │  └─ Customer directory
│  └─ Customer Profile (customers/view.html)
│     └─ History, bookings, contact info
│
├─📱 CONTENT MANAGEMENT SYSTEM
│  ├─ Website Settings (cms/settings.html)
│  ├─ Media (cms/media.html)
│  │  └─ File library
│  ├─ Gallery (cms/gallery.html)
│  │  └─ Image portfolio
│  └─ Content Pages (contents/list.html)
│     └─ Website content
│
├─📊 REPORTS & MONITORING
│  ├─ Summary (reports/summary.html)
│  │  └─ Daily/monthly stats
│  ├─ Staff Report (reports/staff-report.html)
│  │  └─ Performance metrics
│  ├─ Expenses (expenses/list.html)
│  │  └─ Expense tracking
│  └─ Monitor (monitor/list.html)
│     └─ System activity logs
│
├─👨‍💼 USER MANAGEMENT
│  ├─ Staff (user/list.html)
│  ├─ Add Staff (user/form.html)
│  └─ Staff Profile (user/view.html)
│
└─⚙️ SYSTEM
   └─ Login (login.html)
```

---

## 6️⃣ CORE MANAGERS & MODULES DIAGRAM

### Diagram Type: Component/Dependency Diagram

```
BACKOFFICE PAGE ARCHITECTURE
════════════════════════════════════════════════

┌─────────────────────────────────────────────┐
│         Backoffice Pages (42+ HTML)         │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ↓          ↓          ↓
   ┌────────┐ ┌────────┐ ┌────────┐
   │Table   │ │Form    │ │Status  │
   │Manager │ │Manager │ │Monitor │
   └───┬────┘ └───┬────┘ └────┬───┘
       │          │           │
       ├──────────┴───────────┤
       │                      │
       ↓                      ↓
   ┌──────────────┐    ┌──────────────┐
   │CRUD Manager  │    │File Upload   │
   │(Create/Read/ │    │Manager       │
   │ Update/Delete)   │              │
   └────┬─────────┘    └────┬─────────┘
        │                   │
        │    ┌──────────────┘
        │    │
        ↓    ↓
   ┌──────────────────────────┐
   │   apiClient.js           │
   │   (Unified HTTP layer)   │
   │   - Sets auth headers    │
   │   - Handles errors       │
   │   - JSON encoding        │
   └────────────┬─────────────┘
                │
                ↓
   ┌──────────────────────────┐
   │   Backend API Endpoints  │
   │   (27 routes)            │
   └──────────────────────────┘
```

---

## 📝 NOTES FOR ERASER.IO

### Color Scheme Suggestion
- **Blue**: Customer-facing (Website, Website pages)
- **Green**: Core booking system (Bookings, Seat selection)
- **Orange**: Financial (Payments, Expenses)
- **Pink**: Admin decisions (Approval, Rejection)
- **Purple**: Infrastructure (Database, API, Auth)

### Symbol Legend
- **📊** = Dashboard/Analytics
- **📋** = List/Table management
- **📝** = Form/Input
- **💾** = Database model
- **🔐** = Authentication/Security
- **📤** = File operations
- **🔄** = Process/Workflow

### Recommended Diagram Order
1. System Architecture (overview)
2. API Structure (technical)
3. Database ER Diagram (data)
4. Booking Workflow (user journey)
5. Backoffice Pages (frontend)

### Key Metrics for Context
- **27** API endpoints
- **42+** HTML pages
- **14** database models
- **3** application layers
- **6** main functional domains

---

## 🚀 QUICK REFERENCE

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend Server | Express.js | REST API, business logic |
| Database | PostgreSQL + Prisma | Data storage & ORM |
| Frontend Backoffice | Vanilla JS + HTML | Admin interface |
| Frontend Website | Vite + Vanilla JS | Customer booking |
| Authentication | JWT | Secure access control |
| File Storage | Express middleware | Slip uploads, images |

---

This guide provides all necessary information for creating comprehensive, accurate diagrams in Eraser.io. Each section maps directly to a diagram type for visual representation.
