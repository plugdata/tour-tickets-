# Database Setup Instructions

## Problem
The application encountered a database connection error: `User was denied access on the database`

## Solution

### 1. Verify PostgreSQL is Running
Ensure PostgreSQL is installed and running on your system.

**On Windows:**
```bash
# Check if PostgreSQL service is running
Get-Service PostgreSQL*

# Or manually start it
Start-Service PostgreSQL*
```

**On Linux/Mac:**
```bash
# Start PostgreSQL
brew services start postgresql
# or
sudo service postgresql start
```

### 2. Update Database Credentials
Update `backend/.env.local` with correct PostgreSQL credentials:

```env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/ticket_backoffice"
```

Common defaults:
- Username: `postgres`
- Password: (whatever you set during PostgreSQL installation)
- Host: `localhost`
- Port: `5432`
- Database: `ticket_backoffice` (create if doesn't exist)

### 3. Create Database (if needed)
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ticket_backoffice;

# Exit
\q
```

### 4. Apply Migrations
```bash
cd backend

# Apply all pending migrations
npx prisma migrate deploy

# Or reset and seed (WARNING: deletes existing data)
npx prisma migrate reset --force
npx prisma db seed
```

### 5. Restart Backend
```bash
npm run dev:local
```

### 6. Test Connection
Visit http://localhost:5000/api/trips to verify the API is working.

## Recent Schema Changes

The following migrations need to be applied:

1. **20260504000002** - Add multiday fields (returnDate) to BusRound
2. **20260504170307** - Add DraftBusRound table  
3. **20260505000000** - Remove endPoint, require returnDate

All migration files are in `backend/prisma/migrations/`

## If Database is Corrupted

Complete reset:
```bash
cd backend
npx prisma migrate reset --force
```

This will:
- Drop all tables
- Re-create schema
- Run seeders
- Reset fresh

## Contact
If connection still fails, verify:
- PostgreSQL is running
- Credentials are correct
- Database `ticket_backoffice` exists
- Port 5432 is accessible
