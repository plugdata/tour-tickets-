const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: RoudeStack
 *   description: RoudeStack (เขตรอบเที่ยว) management
 */

/**
 * @swagger
 * /api/roudestack:
 *   get:
 *     tags: [RoudeStack]
 *     summary: Get all roude stacks
 *     responses:
 *       200: { description: List of roude stacks }
 */
router.get('/', async (req, res) => {
  try {
    const stacks = await prisma.roudeStack.findMany({
      include: { trip: true, busRounds: true },
      orderBy: { deteroudestr: 'asc' }
    })
    res.json(stacks)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/roudestack/trip/{tripId}:
 *   get:
 *     tags: [RoudeStack]
 *     summary: Get roude stacks by trip
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of roude stacks for trip }
 */
router.get('/trip/:tripId', async (req, res) => {
  try {
    const stacks = await prisma.roudeStack.findMany({
      where: { tripId: Number(req.params.tripId) },
      include: { trip: true, busRounds: true },
      orderBy: { deteroudestr: 'asc' }
    })
    res.json(stacks)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/roudestack/delete-logs:
 *   get:
 *     tags: [RoudeStack]
 *     summary: Get deleted roude stacks history
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by trip title, round name, or deleted by
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
        { roundname: { contains: q, mode: 'insensitive' } },
        { deletedBy: { contains: q, mode: 'insensitive' } },
        { deletedByName: { contains: q, mode: 'insensitive' } }
      ].filter(x => x)
    }

    const logs = await prisma.deleteLogRoudeStack.findMany({
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
 * /api/roudestack/{id}:
 *   get:
 *     tags: [RoudeStack]
 *     summary: Get roude stack by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Roude stack detail }
 */
router.get('/:id', async (req, res) => {
  try {
    const stack = await prisma.roudeStack.findUnique({
      where: { id: Number(req.params.id) },
      include: { trip: true, busRounds: true }
    })
    if (!stack) return res.status(404).json({ message: 'Not found' })
    res.json(stack)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/roudestack:
 *   post:
 *     tags: [RoudeStack]
 *     summary: Create roude stack (Admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tripId, roundname, deteroudestr]
 *             properties:
 *               tripId: { type: integer }
 *               roundname: { type: string }
 *               deteroudestr: { type: string, format: date-time }
 *     responses:
 *       201: { description: Created }
 */
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const stack = await prisma.roudeStack.create({
      data: {
        tripId: Number(req.body.tripId),
        roundname: req.body.roundname,
        deteroudestr: new Date(req.body.deteroudestr)
      },
      include: { trip: true, busRounds: true }
    })
    res.status(201).json(stack)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/roudestack/{id}:
 *   put:
 *     tags: [RoudeStack]
 *     summary: Update roude stack (Admin)
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
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = { ...req.body }
    if (data.deteroudestr) data.deteroudestr = new Date(data.deteroudestr)

    const stack = await prisma.roudeStack.update({
      where: { id: Number(req.params.id) },
      data,
      include: { trip: true, busRounds: true }
    })
    res.json(stack)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/roudestack/{id}:
 *   delete:
 *     tags: [RoudeStack]
 *     summary: Delete roude stack (Admin)
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
    const stackId = Number(req.params.id)

    // ดึงข้อมูล RoudeStack และ Trip ก่อนลบ
    const stack = await prisma.roudeStack.findUnique({
      where: { id: stackId },
      include: { trip: true, busRounds: true }
    })

    if (!stack) {
      return res.status(404).json({ message: 'RoudeStack not found' })
    }

    // สร้าง DeleteLogRoudeStack record
    await prisma.deleteLogRoudeStack.create({
      data: {
        roudeStackId: stack.id,
        tripId: stack.tripId,
        tripTitle: stack.trip?.title || 'Unknown Trip',
        roundname: stack.roundname,
        deteroudestr: stack.deteroudestr,
        stackInfo: {
          roudeStackId: stack.id,
          tripId: stack.tripId,
          roundname: stack.roundname,
          deteroudestr: stack.deteroudestr,
          busRoundCount: stack.busRounds.length,
          busRounds: stack.busRounds.map(br => ({
            id: br.id,
            busNumber: br.busNumber,
            startPoint: br.startPoint,
            totalSeats: br.totalSeats
          }))
        },
        deletedBy: req.user?.username || 'unknown',
        deletedByName: req.user?.name || 'Unknown User'
      }
    })

    // สร้าง DeleteLog records สำหรับ BusRounds แต่ละตัว
    for (const busRound of stack.busRounds) {
      await prisma.deleteLog.create({
        data: {
          busRoundId: busRound.id,
          tripTitle: stack.trip?.title || 'Unknown Trip',
          busNumber: busRound.busNumber,
          departDate: busRound.departDate,
          roundInfo: {
            busRoundId: busRound.id,
            tripId: busRound.tripId,
            roudeStackId: busRound.roudeStackId,
            startPoint: busRound.startPoint,
            totalSeats: busRound.totalSeats,
            bookedSeats: busRound.bookedSeats,
            duration: busRound.duration,
            pickupPoints: busRound.pickupPoints,
            extraPrice: busRound.extraPrice,
            isOpen: busRound.isOpen
          },
          deletedBy: req.user?.username || 'unknown',
          deletedByName: req.user?.name || 'Unknown User',
          deleteReason: `Deleted with RoudeStack: ${stack.roundname}`
        }
      })
    }

    // ลบรอบรถตู้ที่ผูกกับรอบเที่ยวนี้ก่อน (เพื่อความปลอดภัยและไม่ติด constraint)
    await prisma.busRound.deleteMany({ where: { roudeStackId: stackId } })
    // ลบรอบเที่ยว (ใช้ deleteMany เพื่อกัน Error ถ้าหา Record ไม่เจอ)
    await prisma.roudeStack.deleteMany({ where: { id: stackId } })

    res.status(204).send()
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
