import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// define storage root relative to project root
export const STORAGE_ROOT = path.join(__dirname, '../../public/uploads')

export const FOLDERS = {
  DOCUMENTS: path.join(STORAGE_ROOT, 'documents'),
  IMAGES: path.join(STORAGE_ROOT, 'images')
}

/**
 * Ensures that all managed upload directories exist.
 */
export function ensureDirectoryExistence() {
  Object.values(FOLDERS).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`[Storage] Created directory: ${dir}`)
    }
  })
}

export function getPublicUrl(req, folderType, filename) {
  const baseUrl = `${req.protocol}://${req.get('host')}`
  const subfolder = folderType === 'DOCUMENTS' ? 'documents' : 'images'
  return `${baseUrl}/uploads/${subfolder}/${encodeURIComponent(filename)}`
}
