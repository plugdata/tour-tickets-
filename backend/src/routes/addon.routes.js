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
  const addons = await prisma.addon.findMany({})
  res.json(addons)
})

router.get('/active', async (req, res) => {
  const addons = await prisma.addon.findMany({
    where: { isActive: true }
  })
  res.json(addons)
})

router.get('/trip/:tripId', async (req, res) => {
  const addons = await prisma.addon.findMany({
    where: { tripId: Number(req.params.tripId), isActive: true }
  })
  res.json(addons)
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
  const addon = await prisma.addon.create({ data: req.body })
  res.status(201).json(addon)
})

router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  const addon = await prisma.addon.update({
    where: { id: Number(req.params.id) },
    data: req.body
  })
  res.json(addon)
})

router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  await prisma.addon.delete({ where: { id: Number(req.params.id) } })
  res.status(204).send()
})

module.exports = router
