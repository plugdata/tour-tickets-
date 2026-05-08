const fetch = require('node-fetch');

async function diagnose() {
  const baseUrl = 'http://localhost:5000/api';

  try {
    console.log('🔍 Checking Trip 14...\n');

    // Get trip 14
    const tripRes = await fetch(`${baseUrl}/trips/14`);
    const trip = await tripRes.json();
    console.log('✅ Trip 14:', trip);

    // Get all bus rounds
    console.log('\n🔍 Checking all BusRounds...\n');
    const roundsRes = await fetch(`${baseUrl}/bus-rounds`);
    const rounds = await roundsRes.json();
    const trip14Rounds = rounds.filter(r => r.tripId === 14);
    console.log(`Total BusRounds in system: ${rounds.length}`);
    console.log(`BusRounds for Trip 14: ${trip14Rounds.length}`);
    if (trip14Rounds.length > 0) {
      console.log('🚐 Trip 14 Rounds:', trip14Rounds);
    }

    // Get all RoudeStacks
    console.log('\n🔍 Checking RoudeStacks...\n');
    const roudeRes = await fetch(`${baseUrl}/roude-stacks`);
    const roudes = await roudeRes.json();
    const trip14Roudes = roudes.filter(r => r.tripId === 14);
    console.log(`Total RoudeStacks in system: ${roudes.length}`);
    console.log(`RoudeStacks for Trip 14: ${trip14Roudes.length}`);
    if (trip14Roudes.length > 0) {
      console.log('🗺️ Trip 14 RoudeStacks:', trip14Roudes);
    } else {
      console.log('⚠️  WARNING: No RoudeStacks for Trip 14!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnose();
