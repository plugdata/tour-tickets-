const prisma = require('./src/config/prisma')

async function main() {
  try {
    // Test 1: basic slips include
    const pays = await prisma.payment.findMany({
      take: 2,
      include: { slips: true }
    })
    console.log('slips include OK, count=', pays.length)

    // Test 2: check columns
    const cols = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'PaymentSlip'
      ORDER BY ordinal_position
    `
    console.log('PaymentSlip columns:', JSON.stringify(cols))

    // Test 3: full payment query same as route
    const full = await prisma.payment.findMany({
      take: 1,
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
            busRound: { include: { trip: true } },
            seatBookings: true
          }
        },
        user: { select: { id: true, name: true, phone: true } },
        slips: { orderBy: { sequence: 'asc' } }
      }
    })
    console.log('full query OK, id=', full[0]?.id, 'slips=', full[0]?.slips?.length)
  } catch (e) {
    console.error('ERROR:', e.message)
    console.error(e.stack)
  } finally {
    await prisma.$disconnect()
  }
}
main()
