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

    const bRId = Number(busRoundId)
    const now = new Date()
    const holdExpiresAt = new Date(now.getTime() + 10 * 60 * 1000)

    // ── 1. ลบ hold เก่าของ session นี้ ──
    await prisma.seatBooking.deleteMany({
      where: { busRoundId: bRId, sessionToken, bookingId: null }
    })

    // ── 2. ดึง record ทั้งหมดที่อาจขวางที่นั่งที่ต้องการ ──
    const allRows = await prisma.seatBooking.findMany({
      where: { busRoundId: bRId, seatNumber: { in: seatNumbers } },
      select: { id: true, seatNumber: true, bookingId: true, sessionToken: true, holdExpiresAt: true }
    })
    console.log('[HOLD] allRows:', JSON.stringify(allRows))

    // ── 3. แยก: rows ที่มี bookingId (จองแล้ว) vs hold ของ session อื่น ──
    const bookedRows = allRows.filter(r => r.bookingId != null)
    const otherHolds = allRows.filter(r =>
      r.bookingId == null &&
      r.sessionToken !== sessionToken &&
      r.holdExpiresAt && new Date(r.holdExpiresAt) > now
    )

    // ── 4. ตรวจ booking ที่มี bookingId — ถ้ายังไม่มีสลิปให้ปลด ──
    if (bookedRows.length > 0) {
      const bIds = bookedRows.map(r => r.bookingId)

      const bookingRows = await prisma.booking.findMany({
        where: { id: { in: bIds } },
        select: { id: true, status: true }
      })
      const statusMap = Object.fromEntries(bookingRows.map(b => [b.id, b.status]))

      const paymentRows = await prisma.payment.findMany({
        where: { bookingId: { in: bIds } },
        select: { bookingId: true, slipUrl: true }
      })
      const slipMap = Object.fromEntries(paymentRows.map(p => [p.bookingId, p.slipUrl]))

      console.log('[HOLD] statusMap:', JSON.stringify(statusMap))
      console.log('[HOLD] slipMap:', JSON.stringify(slipMap))

      // ปลด: ถ้า booking ไม่ถูก cancel และยังไม่มีสลิป
      const releasable = bookedRows.filter(r =>
        statusMap[r.bookingId] !== 'CANCELLED' && !slipMap[r.bookingId]
      )
      console.log('[HOLD] releasable (no-slip):', releasable.map(r => r.seatNumber))

      if (releasable.length > 0) {
        await prisma.seatBooking.deleteMany({ where: { id: { in: releasable.map(r => r.id) } } })
        console.log('[HOLD] deleted no-slip seats:', releasable.map(r => r.seatNumber))
      }

      // ที่นั่งที่ยังเป็น conflict จริง = มีสลิปแล้ว หรือ cancelled (แต่ cancelled จะถูก treat as available)
      const stillBookedConflicts = bookedRows.filter(r =>
        statusMap[r.bookingId] !== 'CANCELLED' && !!slipMap[r.bookingId]
      )

      if (stillBookedConflicts.length > 0 || otherHolds.length > 0) {
        const debugList = [
          ...stillBookedConflicts.map(r => ({ seatNumber: r.seatNumber, reason: 'จองแล้ว+มีสลิป', bookingId: r.bookingId })),
          ...otherHolds.map(r => ({ seatNumber: r.seatNumber, reason: 'hold อยู่ (session อื่น)', expiresAt: r.holdExpiresAt }))
        ]
        console.log('[HOLD] 409 conflicts:', JSON.stringify(debugList))
        return res.status(409).json({
          message: 'ที่นั่งไม่ว่าง',
          takenSeats: debugList.map(d => d.seatNumber),
          debug: debugList
        })
      }
    } else if (otherHolds.length > 0) {
      // ไม่มี booking แต่มี hold ของคนอื่น
      const debugList = otherHolds.map(r => ({
        seatNumber: r.seatNumber, reason: 'hold อยู่ (session อื่น)', expiresAt: r.holdExpiresAt
      }))
      console.log('[HOLD] 409 hold-only conflicts:', JSON.stringify(debugList))
      return res.status(409).json({
        message: 'ที่นั่งไม่ว่าง',
        takenSeats: debugList.map(d => d.seatNumber),
        debug: debugList
      })
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
