# Bus Round API Testing Guide

## ✅ Test Workflow

### 1️⃣ Get Admin Token
First, login to get an admin token:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Save this token as: `TOKEN=eyJhbGciOiJIUzI1NiIs...`

---

### 2️⃣ Get Trips List
See what trips exist:

```bash
curl -X GET http://localhost:5000/api/trips
```

**Response Example:**
```json
[
  {
    "id": 1,
    "title": "เที่ยววิหารสง่า",
    "price": 1500,
    "tripType": "DOMESTIC",
    "country": "สุโขทัย"
  }
]
```

Save trip ID: `TRIP_ID=1`

---

### 3️⃣ Create Bus Round (with departure times)

```bash
curl -X POST http://localhost:5000/api/bus-rounds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": 1,
    "roundNo": 1,
    "departureDate": "2026-05-17T00:00:00Z",
    "departureTimes": ["06:00", "08:00"],
    "totalSeats": 50,
    "seatsPerTime": 25
  }'
```

**Response:**
```json
{
  "id": 5,
  "tripId": 1,
  "roundNo": 1,
  "departureDate": "2026-05-17T00:00:00.000Z",
  "departureTimes": "[\"06:00\",\"08:00\"]",
  "totalSeats": 50,
  "seatsPerTime": 25,
  "buses": []
}
```

Save round ID: `ROUND_ID=5`

---

### 4️⃣ Add Buses to Round

Add bus "ก":
```bash
curl -X POST http://localhost:5000/api/bus-rounds/5/buses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "busNo": "ก",
    "capacity": 25,
    "status": "ACTIVE"
  }'
```

**Response:**
```json
{
  "id": 7,
  "roundId": 5,
  "busNo": "ก",
  "capacity": 25,
  "status": "ACTIVE"
}
```

Add bus "ข":
```bash
curl -X POST http://localhost:5000/api/bus-rounds/5/buses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "busNo": "ข",
    "capacity": 25,
    "status": "ACTIVE"
  }'
```

Add bus "ค":
```bash
curl -X POST http://localhost:5000/api/bus-rounds/5/buses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "busNo": "ค",
    "capacity": 25,
    "status": "ACTIVE"
  }'
```

---

### 5️⃣ Get Buses for Round

```bash
curl -X GET http://localhost:5000/api/bus-rounds/5/buses
```

**Response:**
```json
[
  {
    "id": 7,
    "roundId": 5,
    "busNo": "ก",
    "capacity": 25,
    "status": "ACTIVE"
  },
  {
    "id": 8,
    "roundId": 5,
    "busNo": "ข",
    "capacity": 25,
    "status": "ACTIVE"
  },
  {
    "id": 9,
    "roundId": 5,
    "busNo": "ค",
    "capacity": 25,
    "status": "ACTIVE"
  }
]
```

---

### 6️⃣ Get All Rounds (Verify Data)

```bash
curl -X GET http://localhost:5000/api/bus-rounds
```

**Response (看看新创建的round):**
```json
[
  {
    "id": 5,
    "tripId": 1,
    "roundNo": 1,
    "departureDate": "2026-05-17T00:00:00.000Z",
    "departureTimes": ["06:00", "08:00"],
    "totalSeats": 50,
    "seatsPerTime": 25,
    "buses": [
      { "id": 7, "busNo": "ก", "capacity": 25, "status": "ACTIVE" },
      { "id": 8, "busNo": "ข", "capacity": 25, "status": "ACTIVE" },
      { "id": 9, "busNo": "ค", "capacity": 25, "status": "ACTIVE" }
    ]
  }
]
```

---

## ✅ Verification Checklist

- [ ] Round created with correct roundNo
- [ ] departureDate saved correctly
- [ ] departureTimes array has ["06:00", "08:00"]
- [ ] totalSeats = 50
- [ ] seatsPerTime = 25
- [ ] 3 buses added (ก, ข, ค)
- [ ] Each bus has capacity = 25
- [ ] Each bus has status = "ACTIVE"
- [ ] buses array populated in round details

---

## 🐛 Troubleshooting

**401 Unauthorized:**
- Make sure TOKEN is set correctly
- Check if token is still valid
- Re-login if needed

**404 Round Not Found:**
- Verify TRIP_ID exists
- Check if ROUND_ID is correct

**400 Bad Request:**
- Check JSON format
- Verify all required fields are present
- Check field types (tripId, roundNo should be integers)

---

## 📊 Complete Test Flow (Bash Script)

```bash
#!/bin/bash

# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

echo "Token: $TOKEN"

# 2. Get Trip
TRIP_ID=$(curl -s http://localhost:5000/api/trips | jq '.[0].id')
echo "Trip ID: $TRIP_ID"

# 3. Create Round
ROUND=$(curl -s -X POST http://localhost:5000/api/bus-rounds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"tripId\": $TRIP_ID,
    \"roundNo\": 1,
    \"departureDate\": \"2026-05-17T00:00:00Z\",
    \"departureTimes\": [\"06:00\", \"08:00\"],
    \"totalSeats\": 50,
    \"seatsPerTime\": 25
  }")

ROUND_ID=$(echo $ROUND | jq '.id')
echo "Round ID: $ROUND_ID"
echo "Round Data: $ROUND"

# 4. Add buses
for BUS in "ก" "ข" "ค"; do
  BUS_RES=$(curl -s -X POST http://localhost:5000/api/bus-rounds/$ROUND_ID/buses \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"busNo\": \"$BUS\", \"capacity\": 25, \"status\": \"ACTIVE\"}")
  echo "Bus $BUS added: $BUS_RES"
done

# 5. Verify
echo -e "\n✅ Final verification:"
curl -s http://localhost:5000/api/bus-rounds/$ROUND_ID/buses | jq '.'
```

---

## Expected Output Structure

```
🚌 ทริป: เที่ยววิหารสง่า (ID: 1)
└─ 🟡 รอบที่ 1 (ID: 5)
   ├─ 📅 วันที่: 2026-05-17
   ├─ ⏰ เวลาออก: ["06:00", "08:00"]
   ├─ 💺 ที่นั่ง: 50 (25 per time)
   └─ 🚌 รถตู้:
      ├─ ก (capacity: 25) ✅
      ├─ ข (capacity: 25) ✅
      └─ ค (capacity: 25) ✅
```
