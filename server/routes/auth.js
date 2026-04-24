import express from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db.js'
import { authRequired, signUser } from '../middleware/auth.js'
import { serializeUser, uploadedImagePayload, userAuthSelectFields, userSelectFields } from '../media.js'
import { imageUpload } from '../upload.js'

const router = express.Router()
const avatarUpload = imageUpload('avatars')

function sanitizeUser(user) {
  return serializeUser(user)
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
  const [[user]] = await pool.query(`SELECT ${userSelectFields} FROM users WHERE id = ?`, [result.insertId])
  const safeUser = sanitizeUser(user)
  res.status(201).json({ user: safeUser, token: signUser(safeUser) })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const [[user]] = await pool.query(`SELECT ${userAuthSelectFields} FROM users WHERE email = ?`, [email || ''])
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  const safeUser = sanitizeUser(user)
  res.json({ user: safeUser, token: signUser(safeUser) })
})

router.get('/avatar/:id', async (req, res) => {
  const [[user]] = await pool.query('SELECT avatar, avatar_mime, avatar_data FROM users WHERE id = ?', [req.params.id])
  if (!user) return res.status(404).json({ message: 'User not found.' })

  if (user.avatar_data) {
    res.type(user.avatar_mime || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=86400')
    return res.end(user.avatar_data)
  }

  if (user.avatar) {
    const target = user.avatar.startsWith('http') ? user.avatar : `/${user.avatar.replace(/^\/+/, '')}`
    return res.redirect(target)
  }

  return res.status(404).json({ message: 'Avatar not found.' })
})

router.get('/me', authRequired, async (req, res) => {
  const [[user]] = await pool.query(`SELECT ${userSelectFields} FROM users WHERE id = ?`, [req.user.id])
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
  const uploadedAvatar = uploadedImagePayload(req.file)

  if (uploadedAvatar) {
    await pool.query(
      'UPDATE users SET name = ?, phone = ?, address = ?, gender = ?, avatar = ?, avatar_mime = ?, avatar_data = ? WHERE id = ?',
      [name, phone || null, address || null, cleanGender, null, uploadedAvatar.mimeType, uploadedAvatar.data, req.user.id],
    )
  } else {
    await pool.query(
      'UPDATE users SET name = ?, phone = ?, address = ?, gender = ?, avatar = ? WHERE id = ?',
      [name, phone || null, address || null, cleanGender, current.avatar, req.user.id],
    )
  }

  const [[user]] = await pool.query(`SELECT ${userSelectFields} FROM users WHERE id = ?`, [req.user.id])
  const safeUser = sanitizeUser(user)
  res.json({ user: safeUser, token: signUser(safeUser) })
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
