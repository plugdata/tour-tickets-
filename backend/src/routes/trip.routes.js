const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: Trips
 *   description: Trip management
 */

/**
 * @swagger
 * /api/trips:
 *   get:
 *     tags: [Trips]
 *     summary: Get all trips
 *     responses:
 *       200: { description: List of trips }
 */
router.get('/', async (req, res) => {
  const { search } = req.query;
  const where = search ? {
    title: { contains: search, mode: 'insensitive' }
  } : {};
  const trips = await prisma.trip.findMany({ 
    where,
    include: { addons: true },
    orderBy: { createdAt: 'desc' }
  })
  res.json(trips)
})

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     tags: [Trips]
 *     summary: Get trip by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Trip detail }
 */
router.get('/:id', async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: Number(req.params.id) },
    include: { addons: true, busRounds: true, contents: true }
  })
  if (!trip) return res.status(404).json({ message: 'Not found' })
  res.json(trip)
})

/**
 * @swagger
 * /api/trips:
 *   post:
 *     tags: [Trips]
 *     summary: Create trip (Admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, price]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               imageUrl: { type: string }
 *               price: { type: number }
 *     responses:
 *       201: { description: Created }
 */
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const trip = await prisma.trip.create({ data: req.body })
    res.status(201).json(trip)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/trips/{id}:
 *   put:
 *     tags: [Trips]
 *     summary: Update trip (Admin)
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
    const trip = await prisma.trip.update({
      where: { id: Number(req.params.id) },
      data: req.body
    })
    res.json(trip)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/trips/{id}:
 *   delete:
 *     tags: [Trips]
 *     summary: Delete trip (Admin)
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
  await prisma.trip.delete({ where: { id: Number(req.params.id) } })
  res.status(204).send()
})

module.exports = router
