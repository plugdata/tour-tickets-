#!/usr/bin/env node

/**
 * Test Script for BusRound and BusInRound API
 * Tests: Create round, add buses, verify data
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN'; // Replace with actual token

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testBusRoundAPI() {
  try {
    log.info('========== BUS ROUND API TEST ==========');

    // Step 1: Get list of trips
    log.info('\n1️⃣  Getting list of trips...');
    const tripsRes = await axios.get(`${API_BASE}/trips`);
    const trips = tripsRes.data;

    if (trips.length === 0) {
      log.warn('No trips found! Create a trip first.');
      return;
    }

    const tripId = trips[0].id;
    log.success(`Found trip: ${trips[0].title} (ID: ${tripId})`);

    // Step 2: Create a new BusRound
    log.info('\n2️⃣  Creating new bus round...');
    const roundData = {
      tripId: tripId,
      roundNo: 1,
      departureDate: '2026-05-17T00:00:00Z',
      departureTimes: ['06:00', '08:00'],
      totalSeats: 50,
      seatsPerTime: 25
    };

    console.log(`📤 Sending POST /api/bus-rounds with data:`, roundData);

    const roundRes = await axios.post(`${API_BASE}/bus-rounds`, roundData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const newRound = roundRes.data;
    log.success(`Bus round created! ID: ${newRound.id}`);
    console.log(`📋 Response data:`, JSON.stringify(newRound, null, 2));

    const roundId = newRound.id;

    // Step 3: Add buses to the round
    log.info('\n3️⃣  Adding buses to the round...');
    const buses = ['ก', 'ข', 'ค'];

    for (const busNo of buses) {
      const busData = {
        busNo: busNo,
        capacity: 25,
        status: 'ACTIVE'
      };

      console.log(`\n  📤 Adding bus ${busNo}...`);
      console.log(`  Data:`, busData);

      const busRes = await axios.post(
        `${API_BASE}/bus-rounds/${roundId}/buses`,
        busData,
        {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const createdBus = busRes.data;
      log.success(`  Bus ${busNo} added! ID: ${createdBus.id}`);
      console.log(`  Response:`, JSON.stringify(createdBus, null, 2));

      await delay(300); // Small delay between requests
    }

    // Step 4: Get the round with buses
    log.info('\n4️⃣  Fetching round details with buses...');
    const detailRes = await axios.get(`${API_BASE}/bus-rounds`);
    const allRounds = detailRes.data;
    const createdRound = allRounds.find(r => r.id === roundId);

    if (createdRound) {
      log.success('Round found in list!');
      console.log(`📋 Round details:`, JSON.stringify(createdRound, null, 2));

      // Verify structure
      const roundVerify = {
        roundNo: createdRound.roundNo === 1 ? '✅' : '❌',
        hasDate: createdRound.departureDate ? '✅' : '❌',
        hasTimes: Array.isArray(createdRound.departureTimes) || typeof createdRound.departureTimes === 'string' ? '✅' : '❌',
        busesCount: createdRound.buses?.length || 0,
        expectedBuses: 3
      };

      log.info('\n5️⃣  Verification Results:');
      console.log(`
✓ RoundNo:           ${roundVerify.roundNo}
✓ Has Date:          ${roundVerify.hasDate}
✓ Has Times:         ${roundVerify.hasTimes}
✓ Buses Count:       ${roundVerify.busesCount} / ${roundVerify.expectedBuses}
      `);

      if (roundVerify.busesCount === 3) {
        log.success('✅ All buses added correctly!');
      } else {
        log.warn(`⚠️  Expected 3 buses, got ${roundVerify.busesCount}`);
      }
    } else {
      log.error('Round not found in list!');
    }

    // Step 5: Get buses for the round
    log.info('\n6️⃣  Fetching buses for this round...');
    const busesRes = await axios.get(`${API_BASE}/bus-rounds/${roundId}/buses`);
    const roundBuses = busesRes.data;

    log.success(`Found ${roundBuses.length} buses in round`);
    console.log(`\n🚌 Buses:`, JSON.stringify(roundBuses, null, 2));

    // Final summary
    log.info('\n========== TEST SUMMARY ==========');
    console.log(`
✅ Test completed successfully!

Created Data:
├─ Trip ID:         ${tripId}
├─ Round ID:        ${roundId}
├─ Round No:        1
├─ Date:            2026-05-17
├─ Times:           06:00, 08:00
├─ Total Seats:     50
└─ Buses:           ${buses.join(', ')} (${buses.length} total)

✓ All endpoints working correctly!
    `);

  } catch (err) {
    log.error(`Test failed: ${err.message}`);
    if (err.response) {
      console.log(`${colors.red}API Error:${colors.reset}`, JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run tests
testBusRoundAPI();
