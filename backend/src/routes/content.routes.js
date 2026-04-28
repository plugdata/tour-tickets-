const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

// GET /api/contents — public+admin, supports ?type=&featured=&hot=&tripId=&limit=&search=&all=1
router.get('/', async (req, res) => {
  try {
    // admin can pass ?all=1 to bypass isActive filter
    const where = req.query.all === '1' ? {} : { isActive: true }

    if (req.query.type)              where.type       = req.query.type
    if (req.query.featured === 'true') where.isFeatured = true
    if (req.query.hot === 'true')      where.isHot      = true
    if (req.query.tripId)              where.tripId     = Number(req.query.tripId)
    if (req.query.search) {
      where.OR = [
        { title: { contains: req.query.search, mode: 'insensitive' } },
        { body:  { contains: req.query.search, mode: 'insensitive' } },
        { tags:  { contains: req.query.search, mode: 'insensitive' } },
      ]
    }

    const take = req.query.limit ? Number(req.query.limit) : undefined
    const skip = req.query.offset ? Number(req.query.offset) : undefined

    const contents = await prisma.content.findMany({
      where,
      include: { trip: { select: { id: true, title: true, imageUrl: true, price: true } } },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    })
    res.json(contents)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/contents/:id — public
router.get('/:id', async (req, res) => {
  try {
    const content = await prisma.content.findUnique({
      where: { id: Number(req.params.id) },
      include: { trip: true },
    })
    if (!content) return res.status(404).json({ message: 'Not found' })
    res.json(content)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// POST /api/contents/inquiry — public (visitor inquiry / experience)
router.post('/inquiry', async (req, res) => {
  try {
    const { title, body, authorName, type } = req.body
    if (!title || !body) return res.status(400).json({ message: 'title and body required' })
    const allowedTypes = ['INQUIRY', 'EXPERIENCE']
    const contentType = allowedTypes.includes(type) ? type : 'INQUIRY'
    const content = await prisma.content.create({
      data: { title, body, authorName, type: contentType, isActive: false },
    })
    res.status(201).json(content)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// POST /api/contents — admin only
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const content = await prisma.content.create({ data: req.body })
    res.status(201).json(content)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// PUT /api/contents/:id — admin only
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const content = await prisma.content.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    })
    res.json(content)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// DELETE /api/contents/:id — admin only
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.content.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
