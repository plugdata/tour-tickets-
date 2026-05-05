#!/bin/bash

# ========================================
# TEST DATA: Create BusRounds with Buses
# ========================================

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidXNlcm5hbWUiOiJ0ZXN0YWRtaW4iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3Nzc5NDY5MDIsImV4cCI6MTc3ODU1MTcwMn0.aDAIDk8RdGaN8RdGaN8rtN0a5HrdiBI7rdmbcx7SUcCJR-g_M"
TRIP_ID=1
API="http://localhost:5000/api"

echo "=========================================="
echo "📊 CREATING MOCK BUS ROUNDS & BUSES"
echo "=========================================="

# ========================================
# 🟡 ROUND 1: 17 May 2026
# ========================================
echo ""
echo "🟡 ROUND 1️⃣  (17 May 2026, 06:00 & 08:00 น.)"
echo "──────────────────────────────────────────"

ROUND1=$(curl -s -X POST $API/bus-rounds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": '$TRIP_ID',
    "busNumber": 1,
    "startPoint": "สถานีขนส่ง กรุงเทพ",
    "endPoint": "เชียงใหม่ (วัดพระสิงห์)",
    "departDate": "2026-05-17T06:00:00Z",
    "totalSeats": 50,
    "duration": "9 ชั่วโมง"
  }')

ROUND1_ID=$(echo $ROUND1 | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "✅ Round 1 created! ID: $ROUND1_ID"
echo "   Date: 17 May 2026"
echo "   Times: 06:00, 08:00 น."
echo "   Seats: 50"

# Add buses for Round 1
echo ""
echo "   🚌 Adding buses..."
for BUS in "ก" "ข" "ค"; do
  BUS_RESULT=$(curl -s -X POST $API/bus-rounds/$ROUND1_ID/buses \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"busNo": "'$BUS'", "capacity": 25, "status": "ACTIVE"}')

  BUS_ID=$(echo $BUS_RESULT | grep -o '"id":[0-9]*' | cut -d':' -f2)
  echo "      ✓ Bus $BUS added (ID: $BUS_ID)"
done

# ========================================
# 🟠 ROUND 2: 15 June 2026
# ========================================
echo ""
echo "🟠 ROUND 2️⃣  (15 June 2026, 06:00 & 08:00 น.)"
echo "──────────────────────────────────────────"

ROUND2=$(curl -s -X POST $API/bus-rounds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": '$TRIP_ID',
    "busNumber": 1,
    "startPoint": "สถานีขนส่ง กรุงเทพ",
    "endPoint": "เชียงใหม่ (วัดพระสิงห์)",
    "departDate": "2026-06-15T06:00:00Z",
    "totalSeats": 50,
    "duration": "9 ชั่วโมง"
  }')

ROUND2_ID=$(echo $ROUND2 | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "✅ Round 2 created! ID: $ROUND2_ID"
echo "   Date: 15 June 2026"
echo "   Times: 06:00, 08:00 น."
echo "   Seats: 50"

echo ""
echo "   🚌 Adding buses..."
for BUS in "ก" "ข" "ค"; do
  BUS_RESULT=$(curl -s -X POST $API/bus-rounds/$ROUND2_ID/buses \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"busNo": "'$BUS'", "capacity": 25, "status": "ACTIVE"}')

  BUS_ID=$(echo $BUS_RESULT | grep -o '"id":[0-9]*' | cut -d':' -f2)
  echo "      ✓ Bus $BUS added (ID: $BUS_ID)"
done

# ========================================
# 🔴 ROUND 3: 29 June 2026
# ========================================
echo ""
echo "🔴 ROUND 3️⃣  (29 June 2026, 06:00 & 08:00 น.)"
echo "──────────────────────────────────────────"

ROUND3=$(curl -s -X POST $API/bus-rounds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": '$TRIP_ID',
    "busNumber": 1,
    "startPoint": "สถานีขนส่ง กรุงเทพ",
    "endPoint": "เชียงใหม่ (วัดพระสิงห์)",
    "departDate": "2026-06-29T06:00:00Z",
    "totalSeats": 50,
    "duration": "9 ชั่วโมง"
  }')

ROUND3_ID=$(echo $ROUND3 | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "✅ Round 3 created! ID: $ROUND3_ID"
echo "   Date: 29 June 2026"
echo "   Times: 06:00, 08:00 น."
echo "   Seats: 50"

echo ""
echo "   🚌 Adding buses..."
for BUS in "ก" "ข" "ค"; do
  BUS_RESULT=$(curl -s -X POST $API/bus-rounds/$ROUND3_ID/buses \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"busNo": "'$BUS'", "capacity": 25, "status": "ACTIVE"}')

  BUS_ID=$(echo $BUS_RESULT | grep -o '"id":[0-9]*' | cut -d':' -f2)
  echo "      ✓ Bus $BUS added (ID: $BUS_ID)"
done

# ========================================
# ✅ SUMMARY
# ========================================
echo ""
echo "=========================================="
echo "✅ SUMMARY"
echo "=========================================="
echo ""
echo "📊 Created Data:"
echo "   • Round 1: ID $ROUND1_ID (17 May 2026) + 3 buses"
echo "   • Round 2: ID $ROUND2_ID (15 June 2026) + 3 buses"
echo "   • Round 3: ID $ROUND3_ID (29 June 2026) + 3 buses"
echo ""
echo "Total: 3 Rounds × 3 Buses = 9 Bus records"
echo ""
echo "=========================================="
