const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: Contents
 *   description: Website content management (posts, blog, FAQ, about)
 */

/**
 * @swagger
 * /api/contents:
 *   get:
 *     tags: [Contents]
 *     summary: Get contents
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [TRIP_POST, BLOG, FAQ, ABOUT, SERVICE] }
 *     responses:
 *       200: { description: List }
 */
router.get('/', async (req, res) => {
  const where = { isActive: true }
  if (req.query.type) where.type = req.query.type
  const contents = await prisma.content.findMany({ where, include: { trip: true } })
  res.json(contents)
})

router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  const content = await prisma.content.create({ data: req.body })
  res.status(201).json(content)
})

router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  const content = await prisma.content.update({
    where: { id: Number(req.params.id) },
    data: req.body
  })
  res.json(content)
})

router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  await prisma.content.delete({ where: { id: Number(req.params.id) } })
  res.status(204).send()
})

module.exports = router
