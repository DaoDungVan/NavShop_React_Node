import express from 'express'
import { pool } from '../db.js'
import { adminRequired } from '../middleware/auth.js'
import { imageUpload, publicUploadPath } from '../upload.js'

const router = express.Router()
const productUpload = imageUpload('products')

router.get('/', async (req, res) => {
  const { keyword = '', brand = '', size = '', resolution = '', panel = '', min_price = '', max_price = '', sort_price = '' } = req.query
  const params = []
  const where = ['1=1']

  if (keyword) { where.push('name LIKE ?'); params.push(`%${keyword}%`) }
  if (brand) { where.push('brand = ?'); params.push(brand) }
  if (size) { where.push('size = ?'); params.push(size) }
  if (resolution) { where.push('resolution = ?'); params.push(resolution) }
  if (panel) { where.push('panel = ?'); params.push(panel) }
  if (min_price) { where.push('price >= ?'); params.push(min_price) }
  if (max_price) { where.push('price <= ?'); params.push(max_price) }

  let order = 'id DESC'
  if (sort_price === 'asc') order = 'price ASC'
  if (sort_price === 'desc') order = 'price DESC'

  const [products] = await pool.query(`SELECT * FROM products WHERE ${where.join(' AND ')} ORDER BY ${order}`, params)
  res.json({ products })
})

router.get('/:id', async (req, res) => {
  const [[product]] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id])
  if (!product) return res.status(404).json({ message: 'Product not found.' })
  res.json({ product })
})

router.post('/', adminRequired, productUpload.single('image'), async (req, res) => {
  const { name, brand, size, resolution, panel, is_curved, price, description } = req.body
  if (!name || !brand || !size || !resolution || !panel || !price) {
    return res.status(422).json({ message: 'Please fill all required fields.' })
  }

  const image = req.file ? publicUploadPath('products', req.file) : null
  const [result] = await pool.query(
    'INSERT INTO products (name, brand, size, resolution, panel, is_curved, price, image, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, brand, size, resolution, panel, is_curved ? 1 : 0, price, image, description || null],
  )
  const [[product]] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId])
  res.status(201).json({ product })
})

router.put('/:id', adminRequired, productUpload.single('image'), async (req, res) => {
  const [[current]] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id])
  if (!current) return res.status(404).json({ message: 'Product not found.' })

  const { name, brand, size, resolution, panel, is_curved, price, description } = req.body
  const image = req.file ? publicUploadPath('products', req.file) : current.image

  await pool.query(
    'UPDATE products SET name = ?, brand = ?, size = ?, resolution = ?, panel = ?, is_curved = ?, price = ?, image = ?, description = ? WHERE id = ?',
    [name, brand, size, resolution, panel, is_curved ? 1 : 0, price, image, description || null, req.params.id],
  )
  const [[product]] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id])
  res.json({ product })
})

router.delete('/:id', adminRequired, async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = ?', [req.params.id])
  res.json({ message: 'Product deleted.' })
})

export default router
