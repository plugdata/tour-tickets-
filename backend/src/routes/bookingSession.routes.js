const router = require('express').Router()
const prisma = require('../config/prisma')
const { randomUUID } = require('crypto')

/**
 * @swagger
 * tags:
 *   name: BookingSessions
 *   description: Customer booking flow session (serial token)
 */

/**
 * POST /api/booking-sessions
 * สร้างหรืออัปเดต session (เก็บ step และข้อมูลที่กรอกมา)
 * Body: { token?, busRoundId?, step?, selectedSeats?, customerData?, addonsData? }
 */
router.post('/', async (req, res) => {
  try {
    const { token, busRoundId, step, selectedSeats, customerData, addonsData, bookingId } = req.body
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    const data = {
      ...(busRoundId !== undefined && { busRoundId }),
      ...(step !== undefined && { step }),
      ...(selectedSeats !== undefined && { selectedSeats: JSON.stringify(selectedSeats) }),
      ...(customerData !== undefined && { customerData: JSON.stringify(customerData) }),
      ...(addonsData !== undefined && { addonsData: JSON.stringify(addonsData) }),
      ...(bookingId !== undefined && { bookingId }),
      expiresAt
    }

    let session
    if (token) {
      session = await prisma.bookingSession.upsert({
        where: { token },
        update: data,
        create: { token, step: 1, expiresAt, ...data }
      })
    } else {
      session = await prisma.bookingSession.create({
        data: { token: randomUUID(), step: 1, expiresAt, ...data }
      })
    }

    res.json(parseSession(session))
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * GET /api/booking-sessions/by-phone?phone=xxx
 * ค้นหา sessions ด้วยเบอร์โทรลูกค้า (สาธารณะ — ใช้ตรวจสถานะ)
 */
router.get('/by-phone', async (req, res) => {
  try {
    const { phone } = req.query
    if (!phone) return res.status(400).json({ message: 'phone required' })
    const norm = phone.replace(/[-\s]/g, '')
    const all = await prisma.bookingSession.findMany()
    const matches = all
      .filter(s => {
        if (!s.customerData) return false
        try {
          const cd = JSON.parse(s.customerData)
          const p = (cd.mainPhone || '').replace(/[-\s]/g, '')
          return p === norm
        } catch { return false }
      })
      .map(s => parseSession(s))
    res.json(matches)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * GET /api/booking-sessions/:token
 * ดึง session ตาม token (ใช้สำหรับ resume)
 */
router.get('/:token', async (req, res) => {
  try {
    const session = await prisma.bookingSession.findUnique({
      where: { token: req.params.token }
    })
    if (!session) return res.status(404).json({ message: 'Session not found' })
    if (new Date(session.expiresAt) < new Date()) {
      return res.status(410).json({ message: 'Session expired' })
    }
    res.json(parseSession(session))
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

function parseSession(s) {
  return {
    ...s,
    selectedSeats: s.selectedSeats ? JSON.parse(s.selectedSeats) : null,
    customerData:  s.customerData  ? JSON.parse(s.customerData)  : null,
    addonsData:    s.addonsData    ? JSON.parse(s.addonsData)    : null
  }
}

module.exports = router
