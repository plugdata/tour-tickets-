const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

// ── Albums ───────────────────────────────────────────────

// GET /api/gallery/albums — public
router.get('/albums', async (req, res) => {
  try {
    const where = {}
    if (req.query.active === 'true') where.isActive = true
    if (req.query.category) where.category = req.query.category

    const albums = await prisma.galleryAlbum.findMany({
      where,
      include: {
        _count: { select: { images: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    res.json(albums)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/gallery/albums/:id — public (with all images)
router.get('/albums/:id', async (req, res) => {
  try {
    const album = await prisma.galleryAlbum.findUnique({
      where: { id: Number(req.params.id) },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!album) return res.status(404).json({ message: 'Not found' })
    res.json(album)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// POST /api/gallery/albums — admin
router.post('/albums', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const album = await prisma.galleryAlbum.create({ data: req.body })
    res.status(201).json(album)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// PUT /api/gallery/albums/:id — admin
router.put('/albums/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const album = await prisma.galleryAlbum.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    })
    res.json(album)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// DELETE /api/gallery/albums/:id — admin (cascade deletes images)
router.delete('/albums/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.galleryAlbum.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// ── Images ───────────────────────────────────────────────

// GET /api/gallery/albums/:id/images — public
router.get('/albums/:id/images', async (req, res) => {
  try {
    const images = await prisma.galleryImage.findMany({
      where: { albumId: Number(req.params.id) },
      orderBy: { sortOrder: 'asc' },
    })
    res.json(images)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// POST /api/gallery/albums/:id/images — admin (add single or bulk [{url,caption},...])
router.post('/albums/:id/images', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const albumId = Number(req.params.id)
    const payload = req.body

    // Support both single {url,caption} and array
    const items = Array.isArray(payload) ? payload : [payload]
    const created = await prisma.$transaction(
      items.map(img =>
        prisma.galleryImage.create({
          data: { albumId, url: img.url, caption: img.caption ?? null, sortOrder: img.sortOrder ?? 99 },
        })
      )
    )
    res.status(201).json(created)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// PUT /api/gallery/images/:id — admin
router.put('/images/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const img = await prisma.galleryImage.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    })
    res.json(img)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// DELETE /api/gallery/images/:id — admin
router.delete('/images/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.galleryImage.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
