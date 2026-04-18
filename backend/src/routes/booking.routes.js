const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Get all bookings (Admin/Stuff)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of bookings }
 */
router.get('/', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  const bookings = await prisma.booking.findMany({
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      busRound: { include: { trip: true } },
      bookingAddons: { include: { addon: true } },
      payment: true
    }
  })
  res.json(bookings)
})

/**
 * @swagger
 * /api/bookings/my:
 *   get:
 *     tags: [Bookings]
 *     summary: Get my bookings
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: My bookings }
 */
router.get('/my', authenticate, async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: {
      busRound: { include: { trip: true } },
      bookingAddons: { include: { addon: true } },
      payment: true
    }
  })
  res.json(bookings)
})

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create booking
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [busRoundId, seats]
 *             properties:
 *               busRoundId: { type: integer }
 *               seats: { type: integer }
 *               foodAllergy: { type: string }
 *               addons:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     addonId: { type: integer }
 *                     quantity: { type: integer }
 *     responses:
 *       201: { description: Booking created }
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { busRoundId, seats, foodAllergy, addons = [], bookingType } = req.body
    const round = await prisma.busRound.findUnique({
      where: { id: busRoundId },
      include: { trip: true }
    })
    if (!round || !round.isOpen) return res.status(400).json({ message: 'Bus round not available' })
    if (round.bookedSeats + seats > round.totalSeats) {
      return res.status(400).json({ message: 'Not enough seats' })
    }

    let addonTotal = 0
    const addonData = []
    for (const a of addons) {
      const addon = await prisma.addon.findUnique({ where: { id: a.addonId } })
      if (addon) {
        addonTotal += addon.price * a.quantity
        addonData.push({ addonId: a.addonId, quantity: a.quantity, price: addon.price * a.quantity })
      }
    }

    const totalAmount = round.trip.price * seats + addonTotal

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        busRoundId,
        seats,
        bookingType: bookingType || (seats > 1 ? 'GROUP' : 'SINGLE'),
        foodAllergy,
        totalAmount,
        bookingAddons: { create: addonData }
      },
      include: { bookingAddons: { include: { addon: true } } }
    })

    await prisma.busRound.update({
      where: { id: busRoundId },
      data: { bookedSeats: { increment: seats } }
    })

    res.status(201).json(booking)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     tags: [Bookings]
 *     summary: Update booking status (Admin/Stuff)
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
 *               status: { type: string, enum: [PENDING, CONFIRMED, CANCELLED] }
 *     responses:
 *       200: { description: Updated }
 */
/**
 * @swagger
 * /api/bookings/round/{roundId}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get bookings by bus round (Admin/Stuff)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Bookings for this round }
 */
router.get('/round/:roundId', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { busRoundId: Number(req.params.roundId) },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      busRound: { include: { trip: true } },
      bookingAddons: { include: { addon: true } },
      payment: true,
      seatBookings: true
    }
  })
  res.json(bookings)
})

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get single booking detail (Admin/Stuff)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Booking detail }
 */
router.get('/:id', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      busRound: { include: { trip: true } },
      bookingAddons: { include: { addon: true } },
      payment: true
    }
  })
  if (!booking) return res.status(404).json({ message: 'Not found' })
  res.json(booking)
})

router.patch('/:id/status', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  try {
    const { status, cancelReason } = req.body
    const booking = await prisma.booking.update({
      where: { id: Number(req.params.id) },
      data: { status }
    })

    // บันทึก cancel log เมื่อยกเลิก
    if (status === 'CANCELLED') {
      const admin = await prisma.user.findUnique({ where: { id: req.user.id } })
      await prisma.cancelLog.create({
        data: {
          bookingId: Number(req.params.id),
          cancelledById: req.user.id,
          cancelledByUsername: req.user.username,
          cancelledByName: admin?.name || req.user.username,
          cancelReason: cancelReason || null,
          cancelledAt: new Date().toISOString()
        }
      })
    }

    res.json(booking)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
