// ล้าง SeatBookings ที่ booking ถูก CANCELLED แล้ว
const prisma = require('./src/config/prisma')

async function main() {
  // หา SeatBookings ที่ bookingId ชี้ไป booking ที่ CANCELLED
  const cancelledBookings = await prisma.booking.findMany({
    where: { status: 'CANCELLED' },
    select: { id: true, busRoundId: true }
  })

  if (!cancelledBookings.length) {
    console.log('ไม่มี CANCELLED bookings')
    return
  }

  const ids = cancelledBookings.map(b => b.id)
  console.log('CANCELLED booking IDs:', ids)

  // หา SeatBookings ที่ยังมี bookingId ค้างอยู่
  const stuck = await prisma.seatBooking.findMany({
    where: { bookingId: { in: ids } },
    select: { id: true, seatNumber: true, bookingId: true, busRoundId: true }
  })
  console.log('Stuck SeatBookings:', JSON.stringify(stuck, null, 2))

  if (!stuck.length) {
    console.log('ไม่มีที่นั่งค้าง')
    return
  }

  // ปลด: set bookingId = null
  const result = await prisma.seatBooking.updateMany({
    where: { bookingId: { in: ids } },
    data: { bookingId: null, sessionToken: null, holdExpiresAt: null }
  })
  console.log('Released:', result.count, 'seats')

  // ลบ hold ที่หมดอายุด้วย
  const expired = await prisma.seatBooking.deleteMany({
    where: { bookingId: null, holdExpiresAt: { lt: new Date() } }
  })
  console.log('Deleted expired holds:', expired.count)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e.message); process.exit(1) })
