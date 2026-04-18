const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: Insurance
 *   description: Insurance Policy Form Management
 */

// GET all insurance forms (Admin/Staff)
router.get('/', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  try {
    const { status } = req.query
    const where = {}
    if (status) where.status = status
    const forms = await prisma.insuranceForm.findMany({
      where,
      include: { seatBooking: true }
    })
    res.json(forms)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// ── Insurance Policy Content ────────────────────────────────────────────────

// GET /insurance/policy-content
router.get('/policy-content', async (req, res) => {
  console.log('[INSURANCE_DEBUG] Fetching policy content');
  try {
    let content = await prisma.insurancePolicyContent.findFirst()
    if (!content) {
      content = { id: 1, contentType: 'text', textContent: '', imageUrl: '' }
    }
    res.json(content)
  } catch (e) { 
    console.error('[INSURANCE_DEBUG] Error in GET /policy-content:', e.message);
    res.status(500).json({ message: `[BACKEND_ERROR_GET_POLICY] ${e.message}` }) 
  }
})

// PUT /insurance/policy-content (admin)
router.put('/policy-content', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const content = await prisma.insurancePolicyContent.upsert({
      where: { id: 1 },
      update: req.body,
      create: { ...req.body, id: 1 }
    })
    res.json(content)
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// ── Insurance Conditions (admin configurable) ──────────────────────────────

// GET /insurance/conditions — active conditions (accessible to all)
router.get('/conditions', async (req, res) => {
  console.log('[INSURANCE_DEBUG] Fetching conditions list');
  try {
    const all = req.query.all === '1'
    const where = all ? {} : { isActive: true }
    const items = await prisma.insuranceCondition.findMany({ where, orderBy: { sortOrder: 'asc' } })
    res.json(items)
  } catch (e) { 
    console.error('[INSURANCE_DEBUG] Error in GET /conditions:', e.message);
    res.status(500).json({ message: `[BACKEND_ERROR_LIST_COND] ${e.message}` }) 
  }
})

// POST /insurance/conditions — create (admin)
router.post('/conditions', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const item = await prisma.insuranceCondition.create({ data: req.body })
    res.status(201).json(item)
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// PUT /insurance/conditions/:id — update (admin)
router.put('/conditions/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const item = await prisma.insuranceCondition.update({ where: { id: Number(req.params.id) }, data: req.body })
    res.json(item)
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// PATCH /insurance/conditions/:id/toggle — toggle active (admin)
router.patch('/conditions/:id/toggle', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const existing = await prisma.insuranceCondition.findUnique({ where: { id: Number(req.params.id) } })
    if (!existing) return res.status(404).json({ message: 'Not found' })
    const item = await prisma.insuranceCondition.update({ where: { id: Number(req.params.id) }, data: { isActive: !existing.isActive } })
    res.json(item)
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// DELETE /insurance/conditions/:id — delete (admin)
router.delete('/conditions/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.insuranceCondition.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// ── Insurance Forms ─────────────────────────────────────────────────────────

// GET all forms by booking ID (multiple passengers per booking)
router.get('/booking/:bookingId', authenticate, async (req, res) => {
  try {
    const forms = await prisma.insuranceForm.findMany({
      where: { bookingId: Number(req.params.bookingId) },
      include: { seatBooking: true }
    })
    res.json(forms)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// GET by id (public for guest flow)
router.get('/:id', async (req, res) => {
  try {
    const form = await prisma.insuranceForm.findUnique({
      where: { id: Number(req.params.id) },
      include: { seatBooking: true }
    })
    if (!form) return res.status(404).json({ message: 'Not found' })
    res.json(form)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// POST create/update insurance form — upsert by seatBookingId (public)
router.post('/', async (req, res) => {
  try {
    const { bookingId, seatBookingId, ...rest } = req.body
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' })
    if (!seatBookingId) return res.status(400).json({ message: 'seatBookingId is required' })

    const form = await prisma.insuranceForm.upsert({
      where: { seatBookingId: Number(seatBookingId) },
      update: { ...rest },
      create: { ...rest, bookingId: Number(bookingId), seatBookingId: Number(seatBookingId) },
      include: { seatBooking: true }
    })
    res.status(201).json(form)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// PATCH submit draft → SUBMITTED (public)
router.patch('/:id/submit', async (req, res) => {
  try {
    const form = await prisma.insuranceForm.update({
      where: { id: Number(req.params.id) },
      data: { status: 'SUBMITTED', submittedAt: new Date().toISOString() }
    })
    res.json(form)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// PUT update form (public edit guest draft)
router.put('/:id', async (req, res) => {
  try {
    const form = await prisma.insuranceForm.update({
      where: { id: Number(req.params.id) },
      data: req.body
    })
    res.json(form)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// PATCH review (Admin approve/reject)
router.patch('/:id/review', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { status, rejectReason, issuedPolicyNo } = req.body
    const form = await prisma.insuranceForm.update({
      where: { id: Number(req.params.id) },
      data: {
        status,
        rejectReason: rejectReason || null,
        issuedPolicyNo: issuedPolicyNo || null,
        reviewedBy: req.user.username,
        reviewedAt: new Date().toISOString()
      }
    })
    res.json(form)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
