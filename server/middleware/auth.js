import jwt from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET || 'dev_navshop_secret'

export function signUser(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role, avatar: user.avatar || null },
    jwtSecret,
    { expiresIn: '7d' },
  )
}

export function authOptional(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return next()
  }

  try {
    req.user = jwt.verify(token, jwtSecret)
  } catch {
    req.user = null
  }

  next()
}

export function authRequired(req, res, next) {
  authOptional(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    next()
  })
}

export function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' })
    }
    next()
  })
}
