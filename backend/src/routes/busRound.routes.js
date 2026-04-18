const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: BusRounds
 *   description: Bus round / ticket management
 */

/**
 * @swagger
 * /api/bus-rounds:
 *   get:
 *     tags: [BusRounds]
 *     summary: Get all bus rounds
 *     responses:
 *       200: { description: List of bus rounds }
 */
router.get('/', async (req, res) => {
  try {
    const rounds = await prisma.busRound.findMany({
      include: {
        trip: true,
        _count: {
          select: {
            seatBookings: {
              where: {
                bookingId: { not: null },
                booking: { status: { not: 'CANCELLED' } }
              }
            }
          }
        }
      }
    })
    // Override cached bookedSeats with real-time count from SeatBooking
    const result = rounds.map(({ _count, ...r }) => ({
      ...r,
      bookedSeats: _count.seatBookings
    }))
    res.json(result)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/bus-rounds/trip/{tripId}:
 *   get:
 *     tags: [BusRounds]
 *     summary: Get bus rounds by trip
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List }
 */
router.get('/trip/:tripId', async (req, res) => {
  try {
    const rounds = await prisma.busRound.findMany({
      where: { tripId: Number(req.params.tripId) },
      include: {
        trip: true,
        _count: {
          select: {
            seatBookings: {
              where: {
                bookingId: { not: null },
                booking: { status: { not: 'CANCELLED' } }
              }
            }
          }
        }
      }
    })
    const result = rounds.map(({ _count, ...r }) => ({
      ...r,
      bookedSeats: _count.seatBookings
    }))
    res.json(result)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/bus-rounds:
 *   post:
 *     tags: [BusRounds]
 *     summary: Create bus round (Admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tripId, startPoint, endPoint, departDate, totalSeats]
 *             properties:
 *               tripId: { type: integer }
 *               busNumber: { type: integer }
 *               startPoint: { type: string }
 *               endPoint: { type: string }
 *               departDate: { type: string, format: date-time }
 *               totalSeats: { type: integer }
 *     responses:
 *       201: { description: Created }
 */
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const round = await prisma.busRound.create({ data: req.body })
    res.status(201).json(round)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/bus-rounds/{id}/toggle:
 *   patch:
 *     tags: [BusRounds]
 *     summary: Open/close bus round (Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Updated }
 */
router.patch('/:id/toggle', authenticate, authorize('ADMIN'), async (req, res) => {
  const round = await prisma.busRound.findUnique({ where: { id: Number(req.params.id) } })
  const updated = await prisma.busRound.update({
    where: { id: Number(req.params.id) },
    data: { isOpen: !round.isOpen }
  })
  res.json(updated)
})

router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const round = await prisma.busRound.update({
      where: { id: Number(req.params.id) },
      data: req.body
    })
    res.json(round)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
