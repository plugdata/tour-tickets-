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
      select: { id: true, seatNumber: true, bookingId: true, gender: true, firstName: true, lastName: true, nickname: true, sessionToken: true, holdExpiresAt: true }
    })

    // ดึง booking status + payment slipUrl ด้วย flat queries
    const withBookingIds = seatBookings.filter(sb => sb.bookingId)
    const bookingIdList = withBookingIds.map(sb => sb.bookingId)
    const bookingStatuses = bookingIdList.length ? await prisma.booking.findMany({
      where: { id: { in: bookingIdList } },
      select: { id: true, status: true }
    }) : []
    const paymentSlips = bookingIdList.length ? await prisma.payment.findMany({
      where: { bookingId: { in: bookingIdList } },
      select: { bookingId: true, slipUrl: true }
    }) : []
    const bkStatusMap = Object.fromEntries(bookingStatuses.map(b => [b.id, b.status]))
    const bkSlipMap   = Object.fromEntries(paymentSlips.map(p => [p.bookingId, p.slipUrl]))

    const seatMap = {}
    for (const sb of seatBookings) {
      let status = 'SELECTED' // temp hold (yellow)
      if (sb.bookingId) {
        const isCancelled = bkStatusMap[sb.bookingId] === 'CANCELLED'
        const hasSlip = !!bkSlipMap[sb.bookingId]
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

    res.json({ roundId, totalSeats: round.totalSeats, passengerSeats: round.totalSeats - 1, seats: seatMap })
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

    const bRId = Number(busRoundId)
    const now = new Date()
    const holdExpiresAt = new Date(now.getTime() + 10 * 60 * 1000)

    // ── 1. ลบ hold ทุก session สำหรับที่นั่งที่ต้องการ (hold ไม่ใช่ lock จริง)
    //       และลบ hold เก่าของ session ตัวเองด้วย
    await prisma.seatBooking.deleteMany({
      where: {
        busRoundId: bRId,
        seatNumber: { in: seatNumbers },
        bookingId: null   // ลบเฉพาะ hold (ไม่ลบ booking จริง)
      }
    })

    // ── 2. ดึง SeatBookings ที่ยังมี bookingId ──
    const bookedRows = await prisma.seatBooking.findMany({
      where: { busRoundId: bRId, seatNumber: { in: seatNumbers }, bookingId: { not: null } },
      select: { id: true, seatNumber: true, bookingId: true }
    })

    if (bookedRows.length > 0) {
      const bIds = bookedRows.map(r => r.bookingId)
      const bookingRows = await prisma.booking.findMany({
        where: { id: { in: bIds } },
        select: { id: true, status: true }
      })
      const statusMap = Object.fromEntries(bookingRows.map(b => [b.id, b.status]))

      // orphan: bookingId ชี้ไป booking ที่ถูกลบแล้ว
      const orphanRows = bookedRows.filter(r => !statusMap[r.bookingId])
      if (orphanRows.length > 0) {
        await prisma.seatBooking.deleteMany({ where: { id: { in: orphanRows.map(r => r.id) } } })
      }

      const remainRows = bookedRows.filter(r => statusMap[r.bookingId])
      if (remainRows.length > 0) {
        const paymentRows = await prisma.payment.findMany({
          where: { bookingId: { in: remainRows.map(r => r.bookingId) } },
          select: { bookingId: true, slipUrl: true }
        })
        const slipMap = Object.fromEntries(paymentRows.map(p => [p.bookingId, p.slipUrl]))

        const releasable = remainRows.filter(r =>
          statusMap[r.bookingId] === 'CANCELLED' || !slipMap[r.bookingId]
        )
        if (releasable.length > 0) {
          await prisma.seatBooking.deleteMany({ where: { id: { in: releasable.map(r => r.id) } } })
        }

        const hardLocked = remainRows.filter(r =>
          statusMap[r.bookingId] !== 'CANCELLED' && !!slipMap[r.bookingId]
        )
        if (hardLocked.length > 0) {
          return res.status(409).json({
            message: 'ที่นั่งไม่ว่าง',
            takenSeats: hardLocked.map(r => r.seatNumber)
          })
        }
      }
    }

    // ── 5. สร้าง hold ใหม่ ──
    await prisma.seatBooking.createMany({
      data: seatNumbers.map(sn => ({
        busRoundId: bRId,
        seatNumber: sn,
        gender: gender || null,
        sessionToken,
        holdExpiresAt
      }))
    })

    console.log('[HOLD] success — held seats:', seatNumbers, 'session:', sessionToken)
    res.json({ success: true, expiresAt: holdExpiresAt, sessionToken })
  } catch (e) {
    console.error('[HOLD] error:', e.message)
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
