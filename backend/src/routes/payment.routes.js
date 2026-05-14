const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment and slip management
 */

/**
 * @swagger
 * /api/payments:
 *   get:
 *     tags: [Payments]
 *     summary: Get all payments (Admin/Stuff)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of payments }
 */
router.get('/', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  const payments = await prisma.payment.findMany({
    include: {
      booking: { 
        include: { 
          user: { select: { id: true, name: true, phone: true } },
          busRound: { include: { trip: true } },
          seatBookings: true
        } 
      },
      user: { select: { id: true, name: true, phone: true } },
      slips: { orderBy: { createdAt: 'asc' } }
    }
  })
  res.json(payments)
})

/**
 * @swagger
 * /api/payments:
 *   post:
 *     tags: [Payments]
 *     summary: Submit payment with slip
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, amount, type]
 *             properties:
 *               bookingId: { type: integer }
 *               amount: { type: number }
 *               type: { type: string, enum: [DEPOSIT, FULL] }
 *               slipUrl: { type: string }
 *     responses:
 *       201: { description: Payment submitted }
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { bookingId, amount, type, slipUrl } = req.body
    const payment = await prisma.payment.create({
      data: { bookingId, userId: req.user.id, amount, type, slipUrl }
    })
    res.status(201).json(payment)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/payments/guest/{sessionToken}:
 *   patch:
 *     tags: [Payments]
 *     summary: Update payment slip for guest
 *     parameters:
 *       - in: path
 *         name: sessionToken
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slipUrl]
 *             properties:
 *               slipUrl: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.patch('/guest/:sessionToken', async (req, res) => {
  const { sessionToken } = req.params
  const { slipUrl, isRemainingPayment = false, totalAmount } = req.body

  try {
    const session = await prisma.bookingSession.findUnique({ where: { token: sessionToken } })
    if (!session || !session.bookingId) return res.status(404).json({ message: 'Valid booking session not found' })

    const seatBookings = await prisma.seatBooking.findMany({
      where: { bookingId: session.bookingId }, select: { id: true, seatNumber: true }
    })
    if (seatBookings.length === 0) {
      return res.status(409).json({ message: 'ที่นั่งของคุณถูกจองโดยผู้อื่นแล้ว กรุณาเลือกที่นั่งใหม่อีกครั้ง', code: 'SEAT_TAKEN' })
    }

    const payment = await prisma.payment.findFirst({ where: { bookingId: session.bookingId } })
    if (!payment) return res.status(404).json({ message: 'Payment record not found' })

    // ป้องกันส่งสลิปเพิ่มหลังชำระเต็มแล้ว
    if (payment.type === 'FULL') {
      const existing = await prisma.paymentSlip.count({ where: { paymentId: payment.id } })
      if (existing > 0) return res.status(409).json({ message: 'ชำระเต็มจำนวนแล้ว ไม่สามารถแนบสลิปเพิ่มได้', code: 'ALREADY_FULL' })
    }

    // migrate slipUrl เก่า → PaymentSlip row
    const existingCount = await prisma.paymentSlip.count({ where: { paymentId: payment.id } })
    if (existingCount === 0 && payment.slipUrl && payment.slipUrl !== slipUrl) {
      await prisma.$executeRaw`INSERT INTO "PaymentSlip" ("paymentId","url","slipType","sequence","createdAt") VALUES (${payment.id},${payment.slipUrl},'DEPOSIT',1,NOW())`
    }
    const newSlipType = isRemainingPayment ? 'REMAINING' : 'DEPOSIT'
    const currentCount = await prisma.paymentSlip.count({ where: { paymentId: payment.id } })
    await prisma.$executeRaw`INSERT INTO "PaymentSlip" ("paymentId","url","slipType","sequence","createdAt") VALUES (${payment.id},${slipUrl},${newSlipType},${currentCount + 1},NOW())`

    const updateData = { slipUrl, status: 'PENDING' }
    if (isRemainingPayment) {
      updateData.type = 'FULL'
      if (totalAmount && totalAmount > 0) updateData.amount = totalAmount
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
      include: { slips: { orderBy: { createdAt: 'asc' } } }
    })
    res.json(updatedPayment)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.patch('/:id/confirm', authenticate, authorize('ADMIN'), async (req, res) => {

  const { status } = req.body
  const payment = await prisma.payment.update({
    where: { id: Number(req.params.id) },
    data: {
      status,
      confirmedAt: status === 'CONFIRMED' ? new Date() : null
    }
  })
  if (status === 'CONFIRMED') {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CONFIRMED' }
    })
  }
  res.json(payment)
})

module.exports = router
