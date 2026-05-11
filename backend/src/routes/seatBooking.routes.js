const router = require('express').Router()
const prisma = require('../config/prisma')

/**
 * @swagger
 * tags:
 *   name: SeatBookings
 *   description: Real-time seat status & temporary holds
 */

/**
 * GET /api/seat-bookings/round/:roundId
 * สถานะที่นั่งทั้งหมดในรอบนั้น (public – ไม่ต้อง auth)
 */
router.get('/round/:roundId', async (req, res) => {
  try {
    const roundId = Number(req.params.roundId)
    const round = await prisma.busRound.findUnique({ where: { id: roundId } })
    if (!round) return res.status(404).json({ message: 'Round not found' })

    // ลบ hold ที่หมดอายุ
    const now = new Date()
    await prisma.seatBooking.deleteMany({
      where: {
        busRoundId: roundId,
        bookingId: null,
        holdExpiresAt: { lt: now }
      }
    })

    const seatBookings = await prisma.seatBooking.findMany({
      where: { busRoundId: roundId },
      include: { booking: { select: { id: true, status: true, payment: { select: { slipUrl: true } } } } }
    })

    const seatMap = {}
    for (const sb of seatBookings) {
      let status = 'SELECTED' // temp hold (yellow)
      if (sb.bookingId) {
        const isCancelled = sb.booking?.status === 'CANCELLED'
        const hasSlip = sb.booking?.payment?.slipUrl != null
        status = (isCancelled || !hasSlip) ? 'AVAILABLE' : 'BOOKED'
      }
      const isBooked = !!sb.bookingId && status === 'BOOKED'
      seatMap[sb.seatNumber] = {
        seatNumber: sb.seatNumber,
        status,
        gender: sb.gender,
        nickname: isBooked ? (sb.nickname || sb.firstName || null) : null,
        passengerName: isBooked ? [sb.firstName, sb.lastName].filter(Boolean).join(' ') || null : null,
        isTemporary: !isBooked
      }
    }

    // ส่ง passengerSeats = totalSeats - 2 (ตัด Staff + Driver) ให้ frontend ใช้
    res.json({ roundId, totalSeats: round.totalSeats, passengerSeats: round.totalSeats - 2, seats: seatMap })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * POST /api/seat-bookings/hold
 * จอง temp hold ที่นั่ง (ระหว่างผู้ใช้กำลังเลือก)
 * Body: { busRoundId, seatNumbers: [2,3], sessionToken, gender? }
 */
router.post('/hold', async (req, res) => {
  try {
    const { busRoundId, seatNumbers, sessionToken, gender } = req.body
    if (!busRoundId || !Array.isArray(seatNumbers) || !sessionToken) {
      return res.status(400).json({ message: 'busRoundId, seatNumbers[], sessionToken required' })
    }

    const now = new Date()
    const holdExpiresAt = new Date(now.getTime() + 10 * 60 * 1000) // 10 นาที

    // ลบ hold เก่าของ session นี้ในรอบนี้
    await prisma.seatBooking.deleteMany({
      where: { busRoundId, sessionToken, bookingId: null }
    })

    // ── ปลดที่นั่งที่ "จอง" แล้วแต่ยังไม่แนบสลิป (ให้คนอื่นจองได้) ──
    const bookedForSeats = await prisma.seatBooking.findMany({
      where: { busRoundId, seatNumber: { in: seatNumbers }, bookingId: { not: null } },
      include: { booking: { select: { status: true, payment: { select: { slipUrl: true } } } } }
    })
    const releasableIds = bookedForSeats
      .filter(sb => sb.booking?.status !== 'CANCELLED' && !sb.booking?.payment?.slipUrl)
      .map(sb => sb.id)
    if (releasableIds.length > 0) {
      await prisma.seatBooking.deleteMany({ where: { id: { in: releasableIds } } })
    }

    // ตรวจสอบว่าที่นั่งว่างจริง (ที่นั่งไม่มีสลิปถูกปลดแล้ว เหลือเฉพาะ booking จริงหรือ hold ของคนอื่น)
    const conflicts = await prisma.seatBooking.findMany({
      where: {
        busRoundId,
        seatNumber: { in: seatNumbers },
        OR: [
          { bookingId: { not: null } },
          { bookingId: null, holdExpiresAt: { gt: now } }
        ]
      }
    })

    const takenSeats = conflicts.map(s => s.seatNumber)
    if (takenSeats.length > 0) {
      // ตรวจสอบว่ามี hold เก่าของ session เดิมหรือไม่
      const existingHolds = await prisma.seatBooking.findMany({
        where: {
          busRoundId,
          sessionToken,
          bookingId: null,
          holdExpiresAt: { gt: now }
        }
      })

      // ถ้ามี hold เก่า ให้ยกเลิกทั้งหมดก่อนสร้างใหม่
      if (existingHolds.length > 0) {
        console.log(`[SEAT_BOOKING] Auto-cancelling ${existingHolds.length} existing holds for session ${sessionToken}`)
        await prisma.seatBooking.deleteMany({
          where: {
            busRoundId,
            sessionToken,
            bookingId: null
          }
        })
      }

      return res.status(409).json({ 
        message: 'ที่นั่งไม่ว่าง', 
        takenSeats,
        autoCancelled: existingHolds.length > 0 ? existingHolds.length : undefined,
        sessionToken
      })
    }

    // สร้าง hold ใหม่
    await prisma.seatBooking.createMany({
      data: seatNumbers.map(sn => ({
        busRoundId,
        seatNumber: sn,
        gender: gender || null,
        sessionToken,
        holdExpiresAt
      }))
    })

    res.json({ success: true, expiresAt: holdExpiresAt, sessionToken })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * DELETE /api/seat-bookings/hold/:token
 * ปล่อย hold ทั้งหมดของ session
 */
router.delete('/hold/:token', async (req, res) => {
  try {
    const { count } = await prisma.seatBooking.deleteMany({
      where: { sessionToken: req.params.token, bookingId: null }
    })
    res.json({ success: true, released: count })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
