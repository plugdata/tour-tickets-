import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { createPrismaClient } from '../../config/database.js'
import { FOLDERS, ensureDirectoryExistence, getPublicUrl } from './storage-config.js'

const router = express.Router()
const prisma = createPrismaClient()

// Initialize directories
ensureDirectoryExistence()

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine target folder: Default to documents, or images if specified/detected
    const type = req.body.type === 'image' || file.mimetype.startsWith('image/') ? 'IMAGES' : 'DOCUMENTS'
    cb(null, FOLDERS[type])
  },
  filename: (req, file, cb) => {
    // Handle Thai filenames correctly
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    const ext = path.extname(originalName)
    const name = path.basename(originalName, ext)
    const safeName = name.replace(/[/\\:*?"<>|\0]/g, '').trim() || 'upload'
    
    let finalName = `${safeName}${ext}`
    const targetDir = req.body.type === 'image' || file.mimetype.startsWith('image/') ? FOLDERS.IMAGES : FOLDERS.DOCUMENTS
    
    if (fs.existsSync(path.join(targetDir, finalName))) {
      finalName = `${safeName}-${Date.now()}${ext}`
    }
    cb(null, finalName)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 50 } // 15MB limit
})

// --- API Endpoints ---

/**
 * Generic Upload API
 * POST /api/v2/files/upload
 */
router.post('/upload', upload.array('files', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' })
    }

    const { mapId, category, riskZoneId } = req.body

    const savedRecords = await Promise.all(
      req.files.map(async (file) => {
        const isImage = file.mimetype.startsWith('image/')
        const folderType = isImage ? 'IMAGES' : 'DOCUMENTS'
        const url = getPublicUrl(req, folderType, file.filename)

        const data = {
          namefile: file.filename,
          url: url,
          fileType: isImage ? 'image' : (file.mimetype === 'application/pdf' ? 'pdf' : 'document'),
          size: file.size,
          mapId: mapId ? Number(mapId) : null
        }

        const record = await prisma.uploads.create({ data })
        
        // Link to other models if IDs provided
        if (riskZoneId) {
            await prisma.riskZone.update({
                where: { id: Number(riskZoneId) },
                data: { uploads: { connect: { id: record.id } } }
            })
        }

        return record
      })
    )

    res.json({ success: true, data: savedRecords, message: `Successfully uploaded ${savedRecords.length} files` })
  } catch (error) {
    console.error('Upload Error:', error)
    if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path) } catch {} })
    res.status(500).json({ error: error.message })
  }
})

/**
 * List Files API
 * GET /api/v2/files
 */
router.get('/', async (req, res) => {
  try {
    const { type, mapId } = req.query
    const where = {}
    if (type) where.fileType = type
    if (mapId) where.mapId = Number(mapId)

    const data = await prisma.uploads.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        mapDirect: { select: { id: true, name_local: true, house_no: true } }
      }
    })

    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Delete File API
 * DELETE /api/v2/files/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const record = await prisma.uploads.findUnique({ where: { id } })
    if (!record) return res.status(404).json({ error: 'File not found' })

    // Try to delete from both potential folders (or use conditional based on file type)
    const paths = [
      path.join(FOLDERS.DOCUMENTS, record.namefile),
      path.join(FOLDERS.IMAGES, record.namefile)
    ]

    paths.forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p) })

    await prisma.uploads.delete({ where: { id } })
    res.json({ success: true, message: 'File deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
