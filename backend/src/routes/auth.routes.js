const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, name]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               role: { type: string, enum: [ADMIN, STUFF, CUSTOMER] }
 *     responses:
 *       201: { description: User created }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, phone, email, role } = req.body
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, password: hashed, name, phone, email, role: role || 'CUSTOMER' }
    })
    res.status(201).json({ id: user.id, username: user.username, role: user.role })
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ message: 'Username already exists' })
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: JWT token }
 *       401: { description: Invalid credentials }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
