const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: DraftBusRounds
 *   description: Draft/Test bus rounds before publishing
 */

/**
 * @swagger
 * /api/draft-bus-rounds:
 *   post:
 *     tags: [DraftBusRounds]
 *     summary: Create draft bus round
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tripId, startPoint, departDate, returnDate]
 *             properties:
 *               tripId: { type: integer }
 *               busNumber: { type: integer }
 *               startPoint: { type: string }
 *               departDate: { type: string, format: date-time }
 *               returnDate: { type: string, format: date-time }
 *               duration: { type: string }
 *               totalSeats: { type: integer }
 *               responsiblePerson: { type: string }
 *               extraPrice: { type: number }
 *               pickupPoints: { type: array }
 *               vehicles: { type: array }
 *     responses:
 *       201: { description: Draft created }
 */
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const draft = await prisma.draftBusRound.create({
      data: req.body,
      include: { trip: true }
    })
    res.status(201).json(draft)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/draft-bus-rounds:
 *   get:
 *     tags: [DraftBusRounds]
 *     summary: Get all draft bus rounds
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: tripId
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of drafts }
 */
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { tripId } = req.query
    const where = {}
    if (tripId) where.tripId = Number(tripId)

    const drafts = await prisma.draftBusRound.findMany({
      where,
      include: { trip: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(drafts)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/draft-bus-rounds/{id}:
 *   get:
 *     tags: [DraftBusRounds]
 *     summary: Get draft bus round by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Draft details }
 */
router.get('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const draft = await prisma.draftBusRound.findUnique({
      where: { id: Number(req.params.id) },
      include: { trip: true }
    })
    if (!draft) return res.status(404).json({ message: 'Draft not found' })
    res.json(draft)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/draft-bus-rounds/{id}:
 *   put:
 *     tags: [DraftBusRounds]
 *     summary: Update draft bus round
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: Updated draft }
 */
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const draft = await prisma.draftBusRound.update({
      where: { id: Number(req.params.id) },
      data: req.body,
      include: { trip: true }
    })
    res.json(draft)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/draft-bus-rounds/{id}:
 *   delete:
 *     tags: [DraftBusRounds]
 *     summary: Delete draft bus round
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Deleted }
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.draftBusRound.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/draft-bus-rounds/{id}/publish:
 *   post:
 *     tags: [DraftBusRounds]
 *     summary: Publish draft to actual bus round
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201: { description: Published to BusRound }
 */
router.post('/:id/publish', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const draft = await prisma.draftBusRound.findUnique({
      where: { id: Number(req.params.id) }
    })
    if (!draft) return res.status(404).json({ message: 'Draft not found' })

    // Create BusRound from draft
    const busRound = await prisma.busRound.create({
      data: {
        tripId: draft.tripId,
        busNumber: draft.busNumber,
        startPoint: draft.startPoint,
        endPoint: draft.endPoint,
        departDate: draft.departDate,
        returnDate: draft.returnDate,
        duration: draft.duration,
        totalSeats: draft.totalSeats || 0,
        responsiblePerson: draft.responsiblePerson,
        extraPrice: draft.extraPrice,
        pickupPoints: draft.pickupPoints,
        vehicles: draft.vehicles,
        isOpen: true,
        bookedSeats: 0
      },
      include: { trip: true }
    })

    // Delete draft after publishing
    await prisma.draftBusRound.delete({ where: { id: draft.id } })

    res.status(201).json({
      message: 'Draft published to BusRound',
      busRound
    })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
