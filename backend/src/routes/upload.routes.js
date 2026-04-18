const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const prisma = require('../config/prisma')

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Keep original name but add timestamp prefix to avoid collisions
    // Convert to buffer then to string to handle UTF-8 names correctly if needed
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeName = originalName.replace(/[^a-z0-9\u0E00-\u0E7F.]/gi, '_');
    cb(null, Date.now() + '-' + safeName)
  }
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      return cb(null, true)
    }
    cb(new Error('Only images (jpg, jpeg, png, gif) are allowed!'))
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})

/**
 * @swagger
 * /api/uploads:
 *   post:
 *     summary: Upload a file
 *     tags: [Uploads]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const fileUrl = `/uploads/${req.file.filename}`
    
    // Save to database
    const newUpload = await prisma.upload.create({
      data: {
        filename: req.file.originalname,
        url: fileUrl,
        fileType: req.file.mimetype,
        size: req.file.size
      }
    })

    res.json(newUpload)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

/**
 * @swagger
 * /api/uploads:
 *   get:
 *     summary: Get all uploaded files
 *     tags: [Uploads]
 */
router.get('/', async (req, res) => {
  try {
    const uploads = await prisma.upload.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json(uploads)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

/**
 * @swagger
 * /api/uploads:
 *   delete:
 *     summary: Delete a file from disk and database
 *     tags: [Uploads]
 */
router.delete('/', async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ message: 'URL is required' })

  try {
    // 1. Find the record
    const upload = await prisma.upload.findFirst({ where: { url } })
    
    // 2. Delete from disk
    const filePath = path.join(__dirname, '../../../', url)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // 3. Delete from DB
    if (upload) {
      await prisma.upload.delete({ where: { id: upload.id } })
    }

    res.json({ message: 'File deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
