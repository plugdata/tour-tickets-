const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense tracking (fuel, etc.)
 */

// GET /api/expenses
router.get('/', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  try {
    const where = {}
    if (req.query.busRoundId) where.busRoundId = Number(req.query.busRoundId)
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    })
    res.json(expenses)
  } catch (e) {
    console.error('GET /expenses error:', e)
    res.status(500).json({ message: e.message })
  }
})

// POST /api/expenses
router.post('/', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  try {
    const { category, description, amount, date, busRoundId } = req.body

    if (!category || amount == null) {
      return res.status(400).json({ message: 'category and amount are required' })
    }

    const data = {
      category,
      description: description || null,
      amount: parseFloat(amount),
    }

    // แปลง date string (YYYY-MM-DD) เป็น ISO DateTime
    if (date) {
      data.date = new Date(date)
    }

    if (busRoundId) {
      data.busRoundId = parseInt(busRoundId)
    }

    const expense = await prisma.expense.create({ data })
    res.status(201).json(expense)
  } catch (e) {
    console.error('POST /expenses error:', e)
    res.status(500).json({ message: e.message })
  }
})

// DELETE /api/expenses/:id
router.delete('/:id', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    await prisma.expense.delete({ where: { id } })
    res.json({ message: 'Deleted' })
  } catch (e) {
    console.error('DELETE /expenses error:', e)
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
