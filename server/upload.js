import multer from 'multer'

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export function imageUpload(_folder) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!allowed.has(file.mimetype)) {
        return cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed.'))
      }
      cb(null, true)
    },
  })
}
