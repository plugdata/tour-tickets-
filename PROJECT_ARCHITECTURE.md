# Project Ticket Booking System - Architecture Context

## 📊 System Overview
A comprehensive tour/ticket booking management system with customer-facing website and admin backoffice. Built with Node.js/Express backend, Vanilla JS frontends, and PostgreSQL database.

---

## 1. BACKEND ARCHITECTURE (Node.js + Express)

### Structure
```
backend/
├── src/
│   ├── app.js                 # Express app initialization
│   ├── server.js              # Server entry point
│   ├── config/                # Configuration files
│   │   ├── prisma.js         # Database client
│   │   └── swagger.js         # API documentation
│   ├── middleware/
│   │   └── auth.js            # Authentication & authorization
│   └── routes/                # API Endpoints (27 route modules)
├── prisma/
│   ├── schema.prisma          # Database schema & models
│   ├── migrations/            # Database migrations
│   └── seed.sql               # Initial data
└── .env, .env.production      # Environment configuration
```

### API Route Layers (27 Endpoints)

#### 🔐 **Authentication & User Management**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - New user registration
- `GET/POST /api/users` - User CRUD operations
- `GET/POST /api/users/view/:id` - User profile management

#### 🎫 **Trip & Bus Management**
- `GET/POST /api/trips` - Create/read trips (tours/packages)
- `POST /api/roudestack` - Route stacks (multi-day routes)
- `GET/POST /api/bus-rounds` - Bus round operations (when the trip departs)
- `GET/POST /api/bus-rounds/draft` - Draft bus rounds (not yet published)

#### 📋 **Booking Management**
- `GET/POST /api/bookings` - Main booking records
- `GET/POST /api/booking-sessions` - Temporary booking session tracking
- `GET/POST /api/seat-bookings` - Individual seat selections

#### 💳 **Payment & Financial**
- `GET/POST /api/payments` - Payment records and verification
- `GET/POST /api/bank-accounts` - Bank account management
- `GET/POST /api/expenses` - Expense tracking

#### 🛡️ **Insurance**
- `GET/POST /api/insurance` - Insurance forms and policies
- `POST /api/insurance/conditions` - Insurance terms/conditions

#### 🏪 **Product & Services**
- `GET/POST /api/addons` - Rental add-ons and services

#### 📱 **Content Management**
- `GET/POST /api/contents` - Website content pages
- `GET/POST /api/gallery` - Image gallery
- `GET/POST /api/settings` - Site settings

#### 📊 **Reports & Analytics**
- `GET /api/reports` - Sales and booking reports

#### 📤 **File Management**
- `POST /api/uploads` - File upload handler

---

## 2. FRONTEND ADMIN (BACKOFFICE)

### Purpose
Internal system for staff and management to:
- Manage trips and bus rounds
- Review and approve bookings
- Handle payments and financial records
- Create reports
- Manage website content

### Pages & Modules (42+ HTML pages)

#### **Core Dashboard**
- `dashboard.html` - System overview, KPIs, recent activities

#### **Trip & Bus Management**
- `trips/list.html` - Trip CRUD
- `bus-rounds/list.html` - Bus round schedule management
- `bus-rounds/bus-rounds-modal.html` - Bus round detail modal
- `addons/list.html` - Rental items and services

#### **Booking Management**
- `bookings/list.html` - All bookings with filters
- `bookings/view.html` - Booking detail view
- `booking/seats.html` - Seat plan visualization
- `booking/form.html` - Manual booking entry
- `booking/status.html` - Booking status tracker

#### **Payment & Financial**
- `payments/list.html` - Payment records and slip verification
- `bookmoney/bookmoney.html` - Money received tracking
- `bookmoney/bookbank.html` - Bank account transfers
- `admin/bank-accounts.html` - Bank account setup

#### **Insurance Management**
- `insurance/form.html` - Insurance form management
- `insurance/list.html` - Insurance policies
- `insurance/conditions.html` - Terms and conditions
- `insurance/customer-form.html` - Customer-facing form

#### **Customer Management**
- `customers/list.html` - Customer directory
- `customers/view.html` - Customer profile & booking history

#### **Content Management System**
- `cms/settings.html` - Website configuration
- `cms/media.html` - Media library
- `cms/gallery.html` - Image gallery management
- `contents/list.html` - Web content pages

#### **Reports & Monitoring**
- `reports/summary.html` - Daily/monthly summary
- `reports/staff-report.html` - Staff performance metrics
- `reports/print.html` - Printable reports
- `expenses/list.html` - Expense records
- `monitor/list.html` - System monitoring
- `monitor/report.html` - Activity logs

#### **User Management**
- `user/list.html` - Staff list
- `user/form.html` - Staff CRUD
- `user/view.html` - Staff profile
- `users/list.html` - User roles and permissions

#### **Authentication**
- `login.html` - Admin login

### Shared Modules (Core UI Library)
Located in `frontend/assets/js/`
- **CrudManager.js** - Standard CRUD operations (Create, Read, Update, Delete)
- **FormManager.js** - Form validation and submission
- **TableManager.js** - Dynamic table rendering with sorting
- **PaginationManager.js** - Data pagination
- **FileUploadManager.js** - File upload handling
- **apiClient.js** - Unified API communication
- **features/thai-calendar.js** - Thai date picker

---

## 3. DATABASE SCHEMA (Prisma Models)

### **User & Auth**
```
User
├── id, username, password (hashed)
├── role (ADMIN, STUFF, CUSTOMER)
├── name, phone, email
└── Relationships: → Booking, Payment
```

### **Finance**
```
BankAccount
├── accountNo, accountName, bankName
├── accountType (COMPANY/PERSONAL)
├── qrCodeUrl, bookbankUrl
└── isActive boolean
```

### **Core Booking Models**
```
Trip (Tour Package)
├── title, description, imageUrl
├── price, deposit
├── tripType (DOMESTIC/INTERNATIONAL)
├── isHot, hotOrder
└── → RoudeStack, BusRound, Addon, Content

RoudeStack (Multi-day Route)
├── tripId, roundname, departureDate
└── → BusRound (each date/round)

BusRound (Specific Departure)
├── tripId, roudeStackId
├── busNumber, startPoint, departDate
├── totalSeats, bookedSeats
├── duration, extraPrice
├── pickupPoints (JSON)
└── → Booking, SeatBooking

Booking (Customer Booking Record)
├── userId, busRoundId
├── seats (quantity), bookingType
├── foodAllergy, status (PENDING/CONFIRMED/CANCELLED)
├── totalAmount, recordedBy
└── → BookingAddon, Payment, SeatBooking, InsuranceForm

SeatBooking (Individual Seat)
├── bookingId, busRoundId
├── seatNumber, status
└── Tracks individual seat selections

BookingAddon (Add-on Items)
├── bookingId, addonId
├── quantity, price, totalPrice
└── Links bookings to services
```

### **Payment & Insurance**
```
Payment
├── bookingId, userId
├── transactionId, amount
├── slipUrl (payment proof)
├── status, verifiedBy, verifiedDate
└── For payment verification workflow

InsuranceForm
├── bookingId, insuranceId
├── customerName, age, idCard
├── conditions (JSON array)
└── Insurance policy selection

Addon
├── tripId, name, description
├── price, duration
└── Rental items or services
```

### **CMS & Content**
```
Content
├── tripId, title, body
├── slug, imageUrl
└── Page content management

SiteSetting
├── key, value, description
└── Global site configuration

Gallery
├── title, imageUrl
├── isActive, order
└── Image portfolio
```

### **Operations**
```
Expense
├── date, description
├── amount, category
├── createdBy
└── Cost tracking

CancelLog
├── bookingId, reason
├── userId (who cancelled)
├── createdAt
└── Cancellation audit trail
```

---

## 4. DATA FLOW & WORKFLOWS

### **A. Customer Booking Journey (Website)**
```
1. Homepage
   ↓
2. Search/Filter Trips
   ↓
3. Click Trip → Booking Session Created
   ↓
4. Seat Selection (SeatBooking records)
   ↓
5. Fill Booking Form
   ↓
6. Fill Insurance Form
   ↓
7. Payment Notification (upload slip)
   ↓
8. Status: PENDING (awaiting approval)
```

### **B. Admin Approval Workflow (Backoffice)**
```
1. Admin Reviews Booking
   ├─ Verify payment slip
   ├─ Check seat availability
   └─ Review insurance form
   ↓
2. Admin Decision
   ├─ APPROVE
   │  └─ Status: CONFIRMED
   │     └─ Send confirmation email/SMS
   │
   └─ REJECT
      └─ Status: CANCELLED
         └─ Process refund
         └─ Notify customer
```

### **C. Payment Verification Flow**
```
Customer Upload Slip
   ↓
Staff Review (bookmoney page)
   ├─ Compare amount with booking total
   ├─ Verify bank account
   └─ Check date
   ↓
Approve Payment (Payment.verifiedBy set)
   ↓
Update Booking Status
```

---

## 5. KEY FEATURES BY MODULE

### **Trip Management**
- Create tour packages with pricing
- Set deposit requirements
- Mark popular trips (isHot)
- Upload trip documents
- Manage active/inactive trips

### **Bus Round Management**
- Schedule specific departures
- Set total seats per bus
- Track booked seats in real-time
- Define pickup points
- Set route-specific pricing
- Create draft rounds (not yet published)

### **Booking System**
- Sessions track temporary shopping carts
- Seats reserved during session
- Multiple add-ons per booking
- Food allergy tracking
- Real-time seat availability

### **Payment Processing**
- Bank account management
- QR code/bookbank integration
- Slip upload and verification
- Approval workflow
- Payment status tracking

### **Insurance Management**
- Insurance form template
- Customer fill-in during booking
- Terms and conditions
- Condition selection (JSON storage)

### **Financial Reports**
- Daily/monthly summaries
- Staff commission tracking
- Expense categorization
- Cancellation tracking with reasons

### **Content Management**
- Website content pages
- Image gallery
- Site-wide settings
- Dynamic configuration

---

## 6. API REQUEST/RESPONSE PATTERN

### Typical Endpoint Pattern
```javascript
// GET - List with pagination
GET /api/bookings?page=1&limit=10&status=PENDING

// POST - Create
POST /api/bookings
{
  "userId": 5,
  "busRoundId": 12,
  "seats": 2,
  "totalAmount": 3000,
  "foodAllergy": "shellfish"
}

// GET - Detail
GET /api/bookings/42

// PUT/PATCH - Update
PATCH /api/bookings/42
{
  "status": "CONFIRMED"
}

// DELETE - Remove
DELETE /api/bookings/42
```

### Standard Response
```json
{
  "success": true,
  "data": { /* model data */ },
  "message": "Operation successful",
  "timestamp": "2025-05-05T12:00:00Z"
}
```

---

## 7. AUTHENTICATION & SECURITY

### Auth Flow
1. User logs in → JWT token issued
2. Token stored in browser localStorage
3. Auth middleware validates token on each request
4. Role-based access control (ADMIN, STUFF, CUSTOMER)

### Protected Routes
- Most backoffice routes require ADMIN or STUFF role
- Customer pages validate user ID

---

## 8. DEPLOYMENT STRUCTURE

### Backend
- Node.js/Express server (port 3001 or .env configured)
- PostgreSQL database connection
- Environment variables for:
  - Database URL
  - JWT secret
  - File upload paths
  - Email/SMS API keys

### Frontend Backoffice
- Served from `/backend/src` via Express static middleware
- Entry point: `/frontend/pages/login.html`
- All CSS/JS assets in `/frontend/assets/`

### Frontend Website
- Separate Vite project in `/website/`
- May run on different port (vite dev server)
- Connects to same backend API

---

## 9. CURRENT TECH STACK

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL, Prisma ORM |
| **Frontend Backoffice** | Vanilla JS, HTML, CSS, Bootstrap |
| **Frontend Website** | Vite, Vanilla JS |
| **API Documentation** | Swagger/OpenAPI |
| **Authentication** | JWT |
| **File Upload** | Express file middleware |

---

## 10. USAGE FOR ERASER.IO DIAGRAMS

### Recommended Diagram Types

#### 1. **System Architecture Diagram**
- Show 3 layers: Client (Website), Server (Backend), Database
- API routes as middleware connections
- External integrations (Email, SMS, Payment Gateway)

#### 2. **Data Model Diagram (Entity Relationship)**
- 14 core entities with relationships
- Highlight primary/foreign keys
- Show enums (Role, BookingStatus, AddonType)

#### 3. **Booking Workflow Flowchart**
- Customer journey → Admin approval → Confirmation
- Decision points and parallel branches

#### 4. **API Structure Diagram**
- 27 endpoints organized by functional domain
- Show request/response types
- Authentication requirements

#### 5. **Frontend Module Dependency**
- Pages → Shared Managers → API Client
- Show which pages use which managers

---

## 11. MAINTENANCE & FUTURE CONSIDERATIONS

- **Migration Strategy**: Database changes via Prisma migrations
- **Scalability**: API stateless, can be load-balanced
- **Real-time Updates**: Current polling model; consider WebSockets for live seat updates
- **Caching**: No caching layer currently; Redis could improve performance
- **Testing**: No automated tests visible; integration/E2E tests recommended
