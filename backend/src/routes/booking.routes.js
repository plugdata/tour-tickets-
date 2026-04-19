const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Get all bookings (Admin/Stuff)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of bookings }
 */
router.get('/', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  const bookings = await prisma.booking.findMany({
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      busRound: { include: { trip: true } },
      bookingAddons: { include: { addon: true } },
      payment: true
    }
  })
  res.json(bookings)
})

/**
 * @swagger
 * /api/bookings/my:
 *   get:
 *     tags: [Bookings]
 *     summary: Get my bookings
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: My bookings }
 */
router.get('/my', authenticate, async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: {
      busRound: { include: { trip: true } },
      bookingAddons: { include: { addon: true } },
      payment: true
    }
  })
  res.json(bookings)
})

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create booking
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [busRoundId, seats]
 *             properties:
 *               busRoundId: { type: integer }
 *               seats: { type: integer }
 *               foodAllergy: { type: string }
 *               addons:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     addonId: { type: integer }
 *                     quantity: { type: integer }
 *     responses:
 *       201: { description: Booking created }
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { busRoundId, seats, foodAllergy, addons = [], bookingType } = req.body
    const round = await prisma.busRound.findUnique({
      where: { id: busRoundId },
      include: { trip: true }
    })
    if (!round || !round.isOpen) return res.status(400).json({ message: 'Bus round not available' })
    if (round.bookedSeats + seats > round.totalSeats) {
      return res.status(400).json({ message: 'Not enough seats' })
    }

    let addonTotal = 0
    const addonData = []
    for (const a of addons) {
      const addon = await prisma.addon.findUnique({ where: { id: a.addonId } })
      if (addon) {
        addonTotal += addon.price * a.quantity
        addonData.push({ addonId: a.addonId, quantity: a.quantity, price: addon.price * a.quantity })
      }
    }

    const totalAmount = (round.trip.price + (round.extraPrice || 0)) * seats + addonTotal

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        busRoundId,
        seats,
        bookingType: bookingType || (seats > 1 ? 'GROUP' : 'SINGLE'),
        foodAllergy,
        totalAmount,
        bookingAddons: { create: addonData }
      },
      include: { bookingAddons: { include: { addon: true } } }
    })

    await prisma.busRound.update({
      where: { id: busRoundId },
      data: { bookedSeats: { increment: seats } }
    })

    res.status(201).json(booking)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     tags: [Bookings]
 *     summary: Update booking status (Admin/Stuff)
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
 *               status: { type: string, enum: [PENDING, CONFIRMED, CANCELLED] }
 *     responses:
 *       200: { description: Updated }
 */
/**
 * @swagger
 * /api/bookings/round/{roundId}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get bookings by bus round (Admin/Stuff)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Bookings for this round }
 */
router.get('/round/:roundId', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { busRoundId: Number(req.params.roundId) },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      busRound: { include: { trip: true } },
      bookingAddons: { include: { addon: true } },
      payment: true,
      seatBookings: true
    }
  })
  res.json(bookings)
})

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get single booking detail (Admin/Stuff)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Booking detail }
 */
router.get('/:id', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      busRound: { include: { trip: true } },
      bookingAddons: { include: { addon: true } },
      payment: true
    }
  })
  if (!booking) return res.status(404).json({ message: 'Not found' })
  res.json(booking)
})

router.patch('/:id/status', authenticate, authorize('ADMIN', 'STUFF'), async (req, res) => {
  try {
    const { status, cancelReason } = req.body
    const booking = await prisma.booking.update({
      where: { id: Number(req.params.id) },
      data: { status }
    })

    // บันทึก cancel log เมื่อยกเลิก
    if (status === 'CANCELLED') {
      const admin = await prisma.user.findUnique({ where: { id: req.user.id } })
      await prisma.cancelLog.create({
        data: {
          bookingId: Number(req.params.id),
          cancelledById: req.user.id,
          cancelledByUsername: req.user.username,
          cancelledByName: admin?.name || req.user.username,
          cancelReason: cancelReason || null,
          cancelledAt: new Date().toISOString()
        }
      })
    }

    res.json(booking)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

/**
 * @swagger
 * /api/bookings/guest:
 *   post:
 *     tags: [Bookings]
 *     summary: Create guest booking (no auth required)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionToken, paymentType]
 *             properties:
 *               sessionToken: { type: string }
 *               paymentType: { type: string, enum: [DEPOSIT, FULL] }
 *     responses:
 *       201: { description: Booking created }
 */
router.post('/guest', async (req, res) => {
  try {
    const { sessionToken, paymentType } = req.body
    
    if (!sessionToken) {
      return res.status(400).json({ message: 'sessionToken required' })
    }

    // ดึงข้อมูล session
    const session = await prisma.bookingSession.findUnique({
      where: { token: sessionToken }
    })
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }
    
    if (new Date(session.expiresAt) < new Date()) {
      return res.status(410).json({ message: 'Session expired' })
    }

    const busRoundId = session.busRoundId
    const selectedSeats = session.selectedSeats ? JSON.parse(session.selectedSeats) : []
    const customerData = session.customerData ? JSON.parse(session.customerData) : {}
    const addonsData = session.addonsData ? JSON.parse(session.addonsData) : []

    if (!busRoundId || !selectedSeats.length) {
      return res.status(400).json({ message: 'Invalid session data' })
    }

    // ตรวจสอบรอบรถ
    const round = await prisma.busRound.findUnique({
      where: { id: busRoundId },
      include: { trip: true }
    })
    
    if (!round || !round.isOpen) {
      return res.status(400).json({ message: 'Bus round not available' })
    }

    // ตรวจสอบที่นั่งว่าง (แต่ไม่นับที่นั่งที่ hold โดย session เดียวกัน)
    const conflicts = await prisma.seatBooking.findMany({
      where: {
        busRoundId,
        seatNumber: { in: selectedSeats.map(s => s.seatNumber) },
        OR: [
          { bookingId: { not: null } },
          { 
            bookingId: null, 
            holdExpiresAt: { gt: new Date() },
            sessionToken: { not: sessionToken } // ไม่นับ hold ของ session อื่น
          }
        ]
      }
    })

    if (conflicts.length > 0) {
      return res.status(409).json({ 
        message: 'ที่นั่งไม่ว่าง', 
        takenSeats: conflicts.map(c => c.seatNumber) 
      })
    }

    // คำนวณราคา addons
    let addonTotal = 0
    const bookingAddons = []
    
    for (const addon of addonsData) {
      const addonInfo = await prisma.addon.findUnique({ 
        where: { id: addon.addonId } 
      })
      if (addonInfo) {
        const price = addonInfo.price * addon.quantity
        addonTotal += price
        bookingAddons.push({
          addonId: addon.addonId,
          quantity: addon.quantity,
          price
        })
      }
    }

    // คำนวณยอดรวม
    const seatPrice = (round.trip.price + (round.extraPrice || 0)) * selectedSeats.length
    const totalAmount = seatPrice + addonTotal

    // สร้าง guest user record (ถ้ายังไม่มี)
    const guestUser = await prisma.user.findFirst({
      where: { username: `guest_${sessionToken.substring(0, 8)}` }
    })

    let userId = guestUser?.id
    if (!userId) {
      const newUser = await prisma.user.create({
        data: {
          username: `guest_${sessionToken.substring(0, 8)}`,
          password: 'guest_user', // temporary
          role: 'CUSTOMER',
          name: customerData.mainName || 'Guest User',
          phone: customerData.mainPhone || null,
          email: null
        }
      })
      userId = newUser.id
    }

    // สร้าง booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        busRoundId,
        seats: selectedSeats.length,
        bookingType: selectedSeats.length > 1 ? 'GROUP' : 'SINGLE',
        foodAllergy: customerData.foodAllergy || null,
        totalAmount,
        bookingAddons: { create: bookingAddons }
      },
      include: { bookingAddons: { include: { addon: true } } }
    })

    // สร้าง seatBookings จาก hold seats
    const seatBookings = []
    for (const seat of selectedSeats) {
      // อัปเดต seat booking ที่ hold อยู่
      const seatBooking = await prisma.seatBooking.updateMany({
        where: {
          busRoundId,
          seatNumber: seat.seatNumber,
          sessionToken,
          bookingId: null
        },
        data: {
          bookingId: booking.id,
          // ข้อมูลผู้โดยสาร
          namePrefix: seat.namePrefix || null,
          firstName: seat.firstName || null,
          lastName: seat.lastName || null,
          nickname: seat.nickname || null,
          gender: seat.gender || null,
          nationalId: seat.nationalId || null,
          birthDate: seat.birthDate ? new Date(seat.birthDate) : null,
          phone: seat.phone || null,
          email: seat.email || null,
          bloodType: seat.bloodType || null,
          idCardImageUrl: seat.idCardImageUrl || null,
          foodAllergy: seat.foodAllergy || null,
          pickupPoint: seat.pickupPoint || null,
          dropoffPoint: seat.dropoffPoint || null,
          emergencyName: seat.emergencyName || null,
          emergencyPhone: seat.emergencyPhone || null,
          // ลบ hold session
          sessionToken: null,
          holdExpiresAt: null
        }
      })
      
      seatBookings.push(seatBooking)
    }

    // สร้าง payment record
    const depositRate = round.trip.deposit > 0 ? round.trip.deposit / 100 : 0.3 //  use Trip.deposit or default 30%
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId,
        amount: paymentType === 'DEPOSIT' ? Math.ceil(totalAmount * depositRate) : totalAmount,
        type: paymentType,
        status: 'PENDING'
      }
    })

    // อัปเดตจำนวนที่นั่งที่จองใน busRound
    await prisma.busRound.update({
      where: { id: busRoundId },
      data: { bookedSeats: { increment: selectedSeats.length } }
    })

    // อัปเดต session ด้วย bookingId
    await prisma.bookingSession.update({
      where: { token: sessionToken },
      data: { 
        bookingId: booking.id,
        step: 5 // completed
      }
    })

    res.status(201).json({
      booking,
      payment,
      seatBookings: seatBookings.length,
      message: 'Booking created successfully'
    })

  } catch (e) {
    console.error('Guest booking error:', e)
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
