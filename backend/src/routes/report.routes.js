const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Summary reports and monitor
 */

/**
 * @swagger
 * /api/reports/summary:
 *   get:
 *     tags: [Reports]
 *     summary: Get summary report (Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: busRoundId
 *         schema: { type: integer }
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Summary }
 */
router.get('/summary', authenticate, authorize('ADMIN'), async (req, res) => {
  const { busRoundId, month, year } = req.query

  const bookingWhere = { status: 'CONFIRMED' }
  if (busRoundId) bookingWhere.busRoundId = Number(busRoundId)

  const [bookings, allInsurance, expenses] = await Promise.all([
    prisma.booking.findMany({
      where: bookingWhere,
      include: {
        user: { select: { id: true, name: true, phone: true } },
        bookingAddons: { include: { addon: true } },
        payment: true,
        busRound: { include: { trip: true } }
      }
    }),
    prisma.insuranceForm.findMany({}),
    prisma.expense.findMany({ where: busRoundId ? { busRoundId: Number(busRoundId) } : {} })
  ])

  // attach insurance forms to each booking
  const insuranceMap = {}
  allInsurance.forEach(f => {
    if (!insuranceMap[f.bookingId]) insuranceMap[f.bookingId] = []
    insuranceMap[f.bookingId].push(f)
  })
  const bookingsWithInsurance = bookings.map(b => ({ ...b, insuranceForms: insuranceMap[b.id] || [] }))

  const totalPeople   = bookings.reduce((s, b) => s + b.seats, 0)
  const totalRevenue  = bookings.reduce((s, b) => s + b.totalAmount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  res.json({
    totalBookings: bookings.length,
    totalPeople,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    bookings: bookingsWithInsurance,
    expenses
  })
})

/**
 * @swagger
 * /api/reports/print/{busRoundId}:
 *   get:
 *     tags: [Reports]
 *     summary: Print customer list for bus round (Stuff)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: busRoundId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Customer list for printing }
 */
/**
 * @swagger
 * /api/reports/monthly:
 *   get:
 *     tags: [Reports]
 *     summary: Get monthly aggregated report (Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Monthly summary array }
 */
router.get('/monthly', authenticate, authorize('ADMIN'), async (req, res) => {
  const [bookings, allInsurance, expenses] = await Promise.all([
    prisma.booking.findMany({
      where: { status: 'CONFIRMED' },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        bookingAddons: { include: { addon: true } },
        payment: true,
        busRound: { include: { trip: true } }
      }
    }),
    prisma.insuranceForm.findMany({}),
    prisma.expense.findMany({})
  ])

  // attach insurance forms
  const insuranceMap = {}
  allInsurance.forEach(f => {
    if (!insuranceMap[f.bookingId]) insuranceMap[f.bookingId] = []
    insuranceMap[f.bookingId].push(f)
  })
  const bookingsWithInsurance = bookings.map(b => ({ ...b, insuranceForms: insuranceMap[b.id] || [] }))

  // Group bookings by month of busRound.departDate
  const monthMap = {}
  const key = (y, m) => `${y}-${String(m).padStart(2, '0')}`

  bookingsWithInsurance.forEach(b => {
    const d = new Date(b.busRound?.departDate || b.createdAt)
    const k = key(d.getFullYear(), d.getMonth() + 1)
    if (!monthMap[k]) monthMap[k] = { year: d.getFullYear(), month: d.getMonth() + 1, bookings: [], expenses: [] }
    monthMap[k].bookings.push(b)
  })

  expenses.forEach(e => {
    const d = new Date(e.date)
    const k = key(d.getFullYear(), d.getMonth() + 1)
    if (!monthMap[k]) monthMap[k] = { year: d.getFullYear(), month: d.getMonth() + 1, bookings: [], expenses: [] }
    monthMap[k].expenses.push(e)
  })

  const result = Object.entries(monthMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, data]) => ({
      monthKey,
      year: data.year,
      month: data.month,
      totalBookings: data.bookings.length,
      totalPeople: data.bookings.reduce((s, b) => s + b.seats, 0),
      totalRevenue: data.bookings.reduce((s, b) => s + b.totalAmount, 0),
      totalExpenses: data.expenses.reduce((s, e) => s + e.amount, 0),
      netProfit: data.bookings.reduce((s, b) => s + b.totalAmount, 0) - data.expenses.reduce((s, e) => s + e.amount, 0),
      bookings: data.bookings,
      expenses: data.expenses
    }))

  res.json(result)
})

router.get('/print/:busRoundId', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { busRoundId: Number(req.params.busRoundId), status: 'CONFIRMED' },
    include: {
      user: { select: { name: true, phone: true } },
      bookingAddons: { include: { addon: true } },
      payment: true
    }
  })

  const list = bookings.map(b => ({
    customerName: b.user.name,
    phone: b.user.phone,
    seats: b.seats,
    foodAllergy: b.foodAllergy,
    addons: b.bookingAddons.map(a => `${a.addon.name} x${a.quantity}`).join(', '),
    totalAmount: b.totalAmount,
    paymentStatus: b.payment?.status || 'NONE',
    paymentType: b.payment?.type || '-'
  }))

  res.json(list)
})

module.exports = router
