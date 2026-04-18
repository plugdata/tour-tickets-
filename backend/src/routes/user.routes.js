const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (Admin only)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of users }
 */
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, phone: true, email: true, role: true, createdAt: true }
  })
  res.json(users)
})

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user role
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
 *             properties:
 *               role: { type: string, enum: [ADMIN, STUFF, CUSTOMER] }
 *     responses:
 *       200: { description: Updated user }
 */
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: req.body,
      select: { id: true, username: true, name: true, role: true }
    })
    res.json(user)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
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
  await prisma.user.delete({ where: { id: Number(req.params.id) } })
  res.status(204).send()
})

module.exports = router
