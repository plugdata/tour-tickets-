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
    const { tripId, month, year } = req.query
    const where = {}

    if (tripId) where.tripId = Number(tripId)

    if (month !== undefined && year !== undefined) {
      const m = Number(month) // 0-based (JS convention)
      const y = Number(year)
      const from = new Date(y, m, 1)
      const to   = new Date(y, m + 1, 1)
      where.departDate = { gte: from, lt: to }
    }

    const rounds = await prisma.busRound.findMany({
      where,
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
      },
      orderBy: { departDate: 'asc' }
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
      },
      orderBy: { updatedAt: 'desc' }
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
 * /api/bus-rounds/delete-logs:
 *   get:
 *     tags: [BusRounds]
 *     summary: Get deleted bus rounds history
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by trip title, bus number, or deleted by
 *     responses:
 *       200: { description: List of deleted logs }
 */
router.get('/delete-logs', async (req, res) => {
  try {
    const { q } = req.query
    const where = {}

    if (q) {
      where.OR = [
        { tripTitle: { contains: q, mode: 'insensitive' } },
        { busNumber: isNaN(q) ? undefined : Number(q) },
        { deletedBy: { contains: q, mode: 'insensitive' } },
        { deletedByName: { contains: q, mode: 'insensitive' } }
      ].filter(x => x)
    }

    const logs = await prisma.deleteLog.findMany({
      where,
      orderBy: { deletedAt: 'desc' },
      take: 100
    })

    res.json(logs)
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
    const data = {
      ...req.body,
      tripId: Number(req.body.tripId),
      roudeStackId: Number(req.body.roudeStackId),
      busNumber: Number(req.body.busNumber),
      totalSeats: Number(req.body.totalSeats),
      extraPrice: parseFloat(req.body.extraPrice || 0),
      pickupPoints: req.body.pickupPoints ? (typeof req.body.pickupPoints === 'string' ? JSON.parse(req.body.pickupPoints) : req.body.pickupPoints) : []
    }
    const round = await prisma.busRound.create({ data })
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
    const data = { ...req.body }
    if (data.tripId) data.tripId = Number(data.tripId)
    if (data.roudeStackId) data.roudeStackId = Number(data.roudeStackId)
    if (data.busNumber) data.busNumber = Number(data.busNumber)
    if (data.totalSeats) data.totalSeats = Number(data.totalSeats)
    if (data.extraPrice) data.extraPrice = parseFloat(data.extraPrice)
    if (data.pickupPoints && typeof data.pickupPoints === 'string') data.pickupPoints = JSON.parse(data.pickupPoints)

    const round = await prisma.busRound.update({
      where: { id: Number(req.params.id) },
      data
    })
    res.json(round)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const busRoundId = Number(req.params.id)

    // ดึงข้อมูล BusRound ก่อนลบ
    const round = await prisma.busRound.findUnique({
      where: { id: busRoundId },
      include: { trip: true }
    })

    if (!round) {
      return res.status(404).json({ message: 'BusRound not found' })
    }

    // สร้าง DeleteLog record
    await prisma.deleteLog.create({
      data: {
        busRoundId: round.id,
        tripTitle: round.trip?.title || 'Unknown Trip',
        busNumber: round.busNumber,
        departDate: round.departDate,
        roundInfo: {
          busRoundId: round.id,
          tripId: round.tripId,
          roudeStackId: round.roudeStackId,
          startPoint: round.startPoint,
          totalSeats: round.totalSeats,
          bookedSeats: round.bookedSeats,
          duration: round.duration,
          pickupPoints: round.pickupPoints,
          extraPrice: round.extraPrice,
          isOpen: round.isOpen
        },
        deletedBy: req.user?.username || 'unknown',
        deletedByName: req.user?.name || 'Unknown User'
      }
    })

    // ลบ BusRound
    await prisma.busRound.delete({
      where: { id: busRoundId }
    })

    res.status(204).send()
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
