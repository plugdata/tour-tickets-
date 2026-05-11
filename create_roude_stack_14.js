const fetch = require('node-fetch');

async function createRoudeStackForTrip14() {
  const baseUrl = 'http://localhost:5000/api';

  try {
    console.log('🔐 Logging in as admin...\n');

    // Step 1: Login to get JWT token
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: '12345' })
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${await loginRes.text()}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log(`Token: ${token.substring(0, 20)}...\n`);

    // Step 2: Get trip 14 info
    console.log('📍 Fetching Trip 14...\n');
    const tripRes = await fetch(`${baseUrl}/trips/14`);
    const trip = tripRes.ok ? await tripRes.json() : null;

    if (trip) {
      console.log(`✅ Found Trip 14: "${trip.title}"\n`);
    } else {
      console.log('⚠️  Trip 14 not found, but proceeding to create RoudeStack...\n');
    }

    // Step 3: Create RoudeStack for trip 14
    console.log('🛣️  Creating RoudeStack for Trip 14...\n');

    const roudeName = trip ? `${trip.title} - รอบที่ 1` : 'RoudeStack Trial Trip 14';
    const startDate = new Date('2025-06-15T06:00:00').toISOString();

    const createRes = await fetch(`${baseUrl}/roudestack`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tripId: 14,
        roundname: roudeName,
        deteroudestr: startDate
      })
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Failed to create RoudeStack: ${createRes.status} - ${errorText}`);
    }

    const newRoude = await createRes.json();
    console.log('✅ RoudeStack created successfully!');
    console.log(`\nDetails:`);
    console.log(`  ID: ${newRoude.id}`);
    console.log(`  Name: ${newRoude.roundname}`);
    console.log(`  Start Date: ${new Date(newRoude.deteroudestr).toLocaleString('th-TH')}`);
    console.log(`\n✅ You can now create BusRounds for this RoudeStack!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createRoudeStackForTrip14();
