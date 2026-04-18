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
          busRound: { include: { trip: true } } 
        } 
      },
      user: { select: { id: true, name: true, phone: true } }
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
 * /api/payments/{id}/confirm:
 *   patch:
 *     tags: [Payments]
 *     summary: Confirm payment (Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [CONFIRMED, REJECTED] }
 *     responses:
 *       200: { description: Updated }
 */
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
