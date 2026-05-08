# Backoffice Admin Functions - Complete Guide

## 📌 Overview
The backoffice admin panel is the control center for managing the entire ticket booking system. Staff can manage trips, approvals, payments, and all business operations.

---

## 🎯 Role-Based Access Control

### User Roles
- **ADMIN**: Full system access (owner/manager)
- **STUFF**: Limited access (staff/employees)
- **CUSTOMER**: Read-only access to own data

### Feature Access Matrix

| Feature | ADMIN | STUFF | CUSTOMER |
|---------|:-----:|:-----:|:--------:|
| Dashboard | ✓ | ✓ | - |
| Create/Edit Trip | ✓ | ✓ | - |
| Approve Bookings | ✓ | ✓ | - |
| View Payments | ✓ | ✓ | - |
| Verify Slips | ✓ | ✓ | - |
| Staff Management | ✓ | - | - |
| Reports | ✓ | ✓ | - |
| CMS Settings | ✓ | - | - |
| View Own Bookings | - | - | ✓ |

---

## 📊 DASHBOARD (`dashboard.html`)

### What It Shows
- **KPI Cards**: Total bookings, revenue, pending approvals
- **Charts**: Revenue trend, bookings by status
- **Quick Stats**: 
  - Total customers
  - Trips active
  - Pending payments
  - Monthly revenue
- **Recent Activities**: 
  - Latest bookings
  - Recent payments
  - System notifications

### Common Tasks
- Quick overview of daily operations
- Identify bottlenecks (pending approvals)
- Monitor revenue trends

---

## 🚌 TRIP & BUS MANAGEMENT

### Trips Management (`trips/list.html`)

**What**: Manage tour packages/products

**Operations**:
- ✅ **CREATE** → Add new trip
  - Title, description, image
  - Pricing (base price, deposit required)
  - Trip type (domestic/international)
  - Country, documents
  - Mark as "HOT" with priority order
- 📝 **EDIT** → Update trip details
- 🔍 **VIEW** → See all trip info and bookings
- 🔴 **DEACTIVATE** → Remove from booking site
- ✨ **SET HOT STATUS** → Featured trips appear first

**Data Structure**:
```
Trip (title, price, imageUrl, deposit)
  ↓
  Defines what customers can book
```

---

### Bus Round Management (`bus-rounds/list.html`)

**What**: Schedule specific departures with seat management

**Operations**:
- ✅ **CREATE BUS ROUND**
  - Select trip
  - Select route stack (multi-day info)
  - Set departure date/time
  - Bus number (1, 2, 3...)
  - Total seats (typically 30-50)
  - Starting point
  - Duration
  - Extra pricing
  - Pickup points (JSON format)
  
- 📊 **REAL-TIME SEAT TRACKING**
  - Total seats vs booked seats
  - Available seats calculation
  - Prevent overbooking

- 🟢 **OPEN** → Accept new bookings
- 🔴 **CLOSE** → Stop accepting bookings
- 📋 **VIEW DETAILS** → See all bookings for this round

**Data Structure**:
```
Trip
  ↓
RoudeStack (multi-day route info)
  ↓
BusRound (specific departure)
  ├─ busNumber, departDate
  ├─ totalSeats: 50
  ├─ bookedSeats: 32
  └─ isOpen: true (accepting bookings)
  ↓
Booking (customer bookings)
  ↓
SeatBooking (individual seats assigned)
```

---

### Draft Bus Rounds (`bus-rounds/list.html` - draft section)

**What**: Create bus rounds before publishing to website

**Purpose**: 
- Plan departures without customers seeing them
- Set up complete details before going live
- Bulk create multiple rounds

**Operations**:
- Create draft round
- Edit draft details
- Publish to live (customers can now book)
- Delete if cancelled

---

### Add-ons Management (`addons/list.html`)

**What**: Rental items and services (parking, equipment, meals)

**Operations**:
- ✅ **CREATE ADD-ON**
  - Name (e.g., "Camera Rental")
  - Description
  - Price per unit
  - Duration (days/trip)
  - Link to trip (or all-trips)

- 📝 **EDIT** → Update pricing/description
- 🗑️ **DELETE** → Remove unavailable items

**Usage**: Customers can add these when booking (e.g., helmet rental, meal plan)

---

## 📋 BOOKING MANAGEMENT

### Bookings List (`bookings/list.html`)

**What**: View all customer bookings with comprehensive filtering

**Columns**:
- Booking ID
- Customer name
- Trip name
- Seats reserved
- Status (PENDING / CONFIRMED / CANCELLED)
- Total amount
- Booking date
- Actions (view, edit, cancel)

**Filters**:
- By status (PENDING, CONFIRMED, CANCELLED)
- By date range
- By customer name
- By trip
- By payment status

**Quick Actions**:
- 🔍 View full booking details
- ✅ Approve/Confirm booking
- 🚫 Cancel booking
- 💬 Add notes

---

### Booking Detail View (`bookings/view.html`)

**Shows**:
- Customer information (name, phone, email)
- Trip details (dates, price, description)
- Booking details
  - Number of seats
  - Selected seats (seat numbers)
  - Food allergies
  - Special requests
- Add-ons purchased
- Insurance information
- Payment status & slip
- Booking history/timeline

**Actions**:
- ✅ Approve booking
- 🚫 Reject/cancel
- 📧 Send confirmation email
- 📝 Edit booking (if needed)

---

### Seat Plan (`booking/seats.html`)

**What**: Visual seat layout for a specific bus round

**Features**:
- 🟩 GREEN = Available seats
- 🔴 RED = Booked seats
- 🟡 YELLOW = Currently selected
- Click seat → Assign to booking
- Click booked seat → View booking

**Use Cases**:
- Manual booking creation
- View occupancy at a glance
- Manage individual seat assignments

---

### Manual Booking Entry (`booking/form.html`)

**What**: Staff can manually create bookings (phone/walk-in customers)

**Form Fields**:
- Customer selection (from dropdown)
- Trip selection
- Bus round selection
- Number of seats
- Seat selection (from seat plan)
- Add-ons selection
- Food allergy notes
- Insurance selection

**Workflow**:
1. Staff fills form for customer
2. Selects seats from visual plan
3. Adds any rental items
4. Creates booking as PENDING
5. Customer makes payment
6. Payment gets verified
7. Staff approves → CONFIRMED

---

### Booking Status Tracker (`booking/status.html`)

**What**: Real-time tracking of booking progress

**Shows**:
- Booking stage (form → insurance → payment → approval → confirmed)
- Current status visual indicator
- Timeline of events
- What's pending
- Actions needed

---

## 💳 PAYMENT & FINANCIAL MANAGEMENT

### Payments List (`payments/list.html`)

**What**: Payment verification and approval workflow

**Columns**:
- Payment ID
- Booking ID
- Customer name
- Amount
- Status (PENDING / VERIFIED / REJECTED)
- Payment slip (thumbnail)
- Bank account used
- Verification date
- Verified by (staff name)

**Status Meanings**:
- **PENDING**: Slip uploaded, awaiting staff verification
- **VERIFIED**: Verified by staff, booking can be approved
- **REJECTED**: Slip invalid, customer needs to resubmit

**Verification Process**:
1. View payment slip
2. Check:
   - ✓ Amount matches booking total
   - ✓ Bank account is correct
   - ✓ Transfer date is recent
   - ✓ Slip has all details
3. Click **APPROVE** → Payment.verifiedBy = staff name
4. Or click **REJECT** → Customer notified to resubmit
5. Once approved, booking can be confirmed

---

### Money Received (`bookmoney/bookmoney.html`)

**What**: Daily money tracking summary

**Shows**:
- Date
- Total received today
- Breakdown by:
  - Bank transfer
  - Cash on site
  - Online payment
- Running balance

**Use Case**: Daily reconciliation of funds

---

### Bank Transfers (`bookmoney/bookbank.html`)

**What**: Track transfers between bank accounts

**Records**:
- From account
- To account
- Amount
- Date
- Purpose

**Use Case**: Internal fund movements, accounting

---

### Bank Accounts (`admin/bank-accounts.html`)

**What**: Company/staff bank account management

**Operations**:
- ➕ **ADD ACCOUNT**
  - Account number
  - Account name (owner)
  - Bank name & branch
  - Account type (COMPANY / PERSONAL)
  - QR code (for customers to scan)
  - Bookbank link
  - Image/logo
  
- 📝 **EDIT** → Update details
- 🟢 **ACTIVATE** → Show on website
- 🔴 **DEACTIVATE** → Hide from website
- 🔍 **VIEW** → See which bookings used this account

---

## 🛡️ INSURANCE MANAGEMENT

### Insurance Forms (`insurance/form.html`)

**What**: Insurance form template management

**Operations**:
- Create insurance type (e.g., "Travel Insurance", "Health Protection")
- Set required fields
- Define coverage details
- Set premium amount

---

### Insurance List (`insurance/list.html`)

**What**: All insurance policies

**Shows**:
- Insurance type
- Coverage amount
- Premium price
- Active status
- Number of customers using

---

### Insurance Conditions (`insurance/conditions.html`)

**What**: Terms and conditions text

**Operations**:
- Create/edit terms
- Add conditions (checkboxes customer must agree to)
- Define exclusions
- Set age limits

---

### Customer Forms (`insurance/customer-form.html`)

**What**: View what customers submitted

**Shows**:
- Customer name, ID, age
- Insurance type selected
- Agreed conditions
- Signature
- Submission date

---

## 👥 CUSTOMER MANAGEMENT

### Customers List (`customers/list.html`)

**What**: Customer directory

**Shows**:
- Name, phone, email
- Total bookings
- Total spent
- Registration date
- Last booking date

**Filters**:
- By name
- By registration date
- By booking status

---

### Customer Profile (`customers/view.html`)

**What**: Individual customer details

**Shows**:
- Contact information
- Booking history (all bookings)
- Payment history
- Insurance records
- Special notes/preferences

---

## 📝 CONTENT MANAGEMENT SYSTEM (CMS)

### Website Settings (`cms/settings.html`)

**What**: Global website configuration

**Settings**:
- Site title & description
- Company contact info
- Payment instructions
- Terms & conditions
- Bank account display order
- Featured trips
- Maintenance mode

---

### Media Library (`cms/media.html`)

**What**: File management

**Operations**:
- Upload images/documents
- Organize in folders
- Delete unused files
- View file metadata

---

### Gallery (`cms/gallery.html`)

**What**: Image gallery for website

**Operations**:
- ➕ **ADD IMAGES**
  - Upload image
  - Title & description
  - Set display order
  - Mark as active
  
- 📝 **EDIT** → Update title/description
- 🟢 **PUBLISH** → Show on website
- 🔴 **HIDE** → Remove from view

---

### Content Pages (`contents/list.html`)

**What**: Website page content

**Operations**:
- ➕ **CREATE PAGE**
  - Title
  - Slug (URL)
  - Body (HTML/text)
  - Associated trip
  - Publish date
  
- 📝 **EDIT** → Update content
- 🟢 **PUBLISH** → Go live
- 👁️ **PREVIEW** → See how it looks

**Common Pages**:
- About Us
- Terms & Conditions
- Privacy Policy
- FAQ
- Contact Us

---

## 📊 REPORTS & MONITORING

### Summary Report (`reports/summary.html`)

**Shows**:
- **Daily Summary**
  - New bookings today
  - Revenue today
  - Pending approvals
  - Cancelled bookings
  
- **Monthly Summary**
  - Total bookings this month
  - Total revenue
  - Average booking value
  - Trip popularity

- **Charts**:
  - Revenue trend
  - Booking status distribution
  - Top trips by sales

---

### Staff Report (`reports/staff-report.html`)

**Shows**:
- Staff performance metrics
- Bookings entered by staff
- Commission calculations
- Activity logs
- Monthly summary by staff

---

### Expenses (`expenses/list.html`)

**What**: Track operational costs

**Operations**:
- ➕ **ADD EXPENSE**
  - Date
  - Description
  - Category (fuel, accommodation, food, etc.)
  - Amount
  - Receipt/proof
  
- 📊 **ANALYZE**
  - By category
  - By month
  - Compare to revenue

---

### Monitor (`monitor/list.html` & `monitor/report.html`)

**What**: System activity logs

**Logs**:
- User logins
- Booking changes
- Payment verifications
- Data modifications
- Admin actions

**Use**: Audit trail, troubleshooting, security

---

## 👨‍💼 USER MANAGEMENT

### Staff List (`user/list.html`)

**What**: Manage employees/staff

**Shows**:
- Staff name, username
- Role (ADMIN, STUFF)
- Status (active/inactive)
- Last login
- Phone/email

---

### Add Staff (`user/form.html`)

**What**: Create new employee accounts

**Fields**:
- Username (unique login)
- Password (initial)
- Full name
- Role (ADMIN / STUFF)
- Phone number
- Email
- Department/assignment

---

### Staff Profile (`user/view.html`)

**Shows**:
- Account details
- Bookings created
- Payments verified
- Commission tracking
- Activity history

---

## 🔐 AUTHENTICATION (`login.html`)

**What**: Staff login

**Process**:
1. Enter username
2. Enter password
3. System verifies in User table
4. Issues JWT token
5. Token stored in browser
6. Token sent with each request
7. Backend validates token

**Security**:
- Passwords hashed (bcrypt)
- JWT tokens expire
- Role-based access control
- Activity logging

---

## ⚡ QUICK WORKFLOWS

### Workflow 1: Approve a Booking (Happy Path)
```
1. Open Dashboard → See "5 Pending Approvals"
2. Click "Review Bookings"
3. Find pending booking in list
4. Click → View booking details
5. Verify:
   ✓ Payment slip received
   ✓ Amount correct
   ✓ Seats available
   ✓ Insurance filled
6. Click "APPROVE"
7. Status → CONFIRMED
8. Email sent to customer
```

### Workflow 2: Create New Trip
```
1. Go to Trips List
2. Click "Add New Trip"
3. Fill form:
   - Title: "Phuket 3 Days"
   - Price: 5,000 baht
   - Deposit: 1,000 baht
   - Upload image
   - Set type: DOMESTIC
4. Save
5. Create bus rounds for this trip
6. Publish trip
7. Customers can now book
```

### Workflow 3: Schedule Bus Round
```
1. Go to Bus Rounds
2. Click "Add Schedule"
3. Select Trip
4. Select Route Stack
5. Set departure date
6. Set bus number
7. Set total seats (50)
8. Set extra pricing
9. Define pickup points
10. Save as DRAFT
11. Review details
12. PUBLISH (go live)
```

### Workflow 4: Verify Payment
```
1. Go to Payments
2. Find "PENDING" payment
3. Click → View slip image
4. Verify:
   ✓ Bank account matches
   ✓ Amount matches booking
   ✓ Date is recent
5. Click "VERIFY"
6. Payment status → VERIFIED
7. Now booking can be approved
```

---

## 🎯 BEST PRACTICES

### Before Approving Booking
- ✓ Check payment slip is clear & legible
- ✓ Verify amount matches exactly
- ✓ Confirm pickup point is available
- ✓ Check customer ID for insurance
- ✓ Ensure seats still available

### Bus Round Management
- ✓ Create in DRAFT first
- ✓ Set realistic departure dates
- ✓ Account for drive time/rest stops
- ✓ Don't overbook buses
- ✓ Update pickup points accurately

### Payment Verification
- ✓ Check bank account is active
- ✓ Verify transfer date (not too old)
- ✓ Compare with booking total exactly
- ✓ Keep slip images for records
- ✓ Document rejection reasons

### Customer Communication
- ✓ Send booking confirmation email
- ✓ Remind about trip details 3 days before
- ✓ Provide contact info for questions
- ✓ Send refund confirmation if cancelled

---

This guide provides a comprehensive understanding of all backoffice functions and workflows.
