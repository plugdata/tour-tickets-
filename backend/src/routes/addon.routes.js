const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: Addons
 *   description: Rental equipment and extra services
 */

/**
 * @swagger
 * /api/addons/trip/{tripId}:
 *   get:
 *     tags: [Addons]
 *     summary: Get addons by trip
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of addons }
 */
router.get('/', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  try {
    const addons = await prisma.addon.findMany({})
    res.json(addons)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.get('/active', async (req, res) => {
  try {
    const addons = await prisma.addon.findMany({
      where: { isActive: true }
    })
    res.json(addons)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.get('/trip/:tripId', async (req, res) => {
  try {
    const addons = await prisma.addon.findMany({
      where: { tripId: Number(req.params.tripId), isActive: true }
    })
    res.json(addons)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/addons:
 *   post:
 *     tags: [Addons]
 *     summary: Create addon (Admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               tripId: { type: integer, nullable: true }
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *     responses:
 *       201: { description: Created }
 */
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      description: req.body.description || null,
      price: parseFloat(req.body.price),
      duration: req.body.duration || null,
      tripId: req.body.tripId ? Number(req.body.tripId) : null,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    }
    const addon = await prisma.addon.create({ data })
    res.status(201).json(addon)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = { ...req.body }
    if (data.price) data.price = parseFloat(data.price)
    if (data.tripId) data.tripId = Number(data.tripId)
    const addon = await prisma.addon.update({
      where: { id: Number(req.params.id) },
      data
    })
    res.json(addon)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.addon.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
