import express from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db.js'
import { authRequired, signUser } from '../middleware/auth.js'
import { imageUpload, publicUploadPath } from '../upload.js'

const router = express.Router()
const avatarUpload = imageUpload('avatars')

function sanitizeUser(user) {
  if (!user) return null
  const { password: _password, ...safeUser } = user
  return safeUser
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(422).json({ message: 'Name, email, and password are required.' })
  }

  if (password.length < 6) {
    return res.status(422).json({ message: 'Password must be at least 6 characters.' })
  }

  const [[existing]] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
  if (existing) {
    return res.status(409).json({ message: 'Email already exists.' })
  }

  const hash = await bcrypt.hash(password, 10)
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
    [name, email, hash],
  )
  const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId])
  res.status(201).json({ user: sanitizeUser(user), token: signUser(user) })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const [[user]] = await pool.query('SELECT * FROM users WHERE email = ?', [email || ''])
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  res.json({ user: sanitizeUser(user), token: signUser(user) })
})

router.get('/me', authRequired, async (req, res) => {
  const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id])
  res.json({ user: sanitizeUser(user) })
})

router.put('/profile', authRequired, avatarUpload.single('avatar'), async (req, res) => {
  const { name, phone, address, gender } = req.body
  const cleanGender = gender || null

  if (!name) {
    return res.status(422).json({ message: 'Name is required.' })
  }

  if (cleanGender && !['male', 'female', 'other'].includes(cleanGender)) {
    return res.status(422).json({ message: 'Invalid gender.' })
  }

  const [[current]] = await pool.query('SELECT avatar FROM users WHERE id = ?', [req.user.id])
  const avatar = req.file ? publicUploadPath('avatars', req.file) : current.avatar

  await pool.query(
    'UPDATE users SET name = ?, phone = ?, address = ?, gender = ?, avatar = ? WHERE id = ?',
    [name, phone || null, address || null, cleanGender, avatar, req.user.id],
  )

  const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id])
  res.json({ user: sanitizeUser(user), token: signUser(user) })
})

router.put('/password', authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(422).json({ message: 'Please provide a valid password.' })
  }

  const [[user]] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id])
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(422).json({ message: 'Current password is incorrect.' })
  }

  const hash = await bcrypt.hash(newPassword, 10)
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id])
  res.json({ message: 'Password changed successfully.' })
})

export default router
