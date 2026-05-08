const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check trip 14
    const trip = await prisma.trips.findUnique({
      where: { id: 14 },
      include: { roudeStack: true }
    });

    console.log('=== Trip 14 ===');
    console.log(JSON.stringify(trip, null, 2));

    // Check bus rounds for trip 14
    const rounds = await prisma.busRounds.findMany({
      where: { tripId: 14 },
      include: { trip: true, roudeStack: true }
    });

    console.log('\n=== Bus Rounds for Trip 14 ===');
    console.log(`Found ${rounds.length} rounds`);
    console.log(JSON.stringify(rounds, null, 2));

    // Check RoudeStacks for trip 14
    const roudestacks = await prisma.roudeStack.findMany({
      where: { tripId: 14 }
    });

    console.log('\n=== RoudeStacks for Trip 14 ===');
    console.log(`Found ${roudestacks.length} RoudeStacks`);
    console.log(JSON.stringify(roudestacks, null, 2));

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
