const router = require('express').Router()
const prisma = require('../config/prisma')

router.get('/test', (req, res) => res.json({ message: 'ok' }))

router.get('/inspect-seats/:roundId', async (req, res) => {
  try {
    const roundId = Number(req.params.roundId)
    const seats = await prisma.seatBooking.findMany({
      where: { busRoundId: roundId },
      select: { id: true, seatNumber: true, bookingId: true, sessionToken: true, holdExpiresAt: true, gender: true }
    })
    const bIds = seats.filter(s => s.bookingId).map(s => s.bookingId)
    const bookings = bIds.length ? await prisma.booking.findMany({ where: { id: { in: bIds } }, select: { id: true, status: true } }) : []
    const bMap = Object.fromEntries(bookings.map(b => [b.id, b.status]))
    res.json({ roundId, count: seats.length, seats: seats.map(s => ({ ...s, bookingStatus: s.bookingId ? bMap[s.bookingId] : null })) })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

router.delete('/seat-booking/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const sb = await prisma.seatBooking.findUnique({ where: { id }, select: { id: true, seatNumber: true, bookingId: true, busRoundId: true } })
    if (!sb) return res.status(404).json({ message: 'ไม่พบ SeatBooking id=' + id })
    await prisma.insuranceForm.deleteMany({ where: { seatBookingId: id } })
    await prisma.seatBooking.delete({ where: { id } })
    res.json({ deleted: true, seatBooking: sb })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

module.exports = router
