import fs from 'fs'
import path from 'path'
import multer from 'multer'

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

export function imageUpload(folder) {
  const uploadDir = path.join(process.cwd(), 'server', 'uploads', folder)
  ensureDir(uploadDir)

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
      cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`)
    },
  })

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!allowed.has(file.mimetype)) {
        return cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed.'))
      }
      cb(null, true)
    },
  })
}

export function publicUploadPath(folder, file) {
  return `uploads/${folder}/${file.filename}`
}
