import express from 'express'
import { pool } from '../db.js'
import { adminRequired } from '../middleware/auth.js'
import { productSelectFields, serializeProduct, serializeProducts, uploadedImagePayload } from '../media.js'
import { imageUpload } from '../upload.js'

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

  const [products] = await pool.query(`SELECT ${productSelectFields} FROM products WHERE ${where.join(' AND ')} ORDER BY ${order}`, params)
  res.json({ products: serializeProducts(products) })
})

router.get('/:id/image', async (req, res) => {
  const [[product]] = await pool.query('SELECT image, image_mime, image_data FROM products WHERE id = ?', [req.params.id])
  if (!product) return res.status(404).json({ message: 'Product not found.' })

  if (product.image_data) {
    res.type(product.image_mime || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=86400')
    return res.end(product.image_data)
  }

  if (product.image) {
    const target = product.image.startsWith('http') ? product.image : `/${product.image.replace(/^\/+/, '')}`
    return res.redirect(target)
  }

  return res.status(404).json({ message: 'Product image not found.' })
})

router.get('/:id', async (req, res) => {
  const [[product]] = await pool.query(`SELECT ${productSelectFields} FROM products WHERE id = ?`, [req.params.id])
  if (!product) return res.status(404).json({ message: 'Product not found.' })
  res.json({ product: serializeProduct(product) })
})

router.post('/', adminRequired, productUpload.single('image'), async (req, res) => {
  const { name, brand, size, resolution, panel, is_curved, price, description } = req.body
  if (!name || !brand || !size || !resolution || !panel || !price) {
    return res.status(422).json({ message: 'Please fill all required fields.' })
  }

  const uploadedImage = uploadedImagePayload(req.file)
  const [result] = await pool.query(
    'INSERT INTO products (name, brand, size, resolution, panel, is_curved, price, image, image_mime, image_data, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      name,
      brand,
      size,
      resolution,
      panel,
      is_curved ? 1 : 0,
      price,
      null,
      uploadedImage?.mimeType || null,
      uploadedImage?.data || null,
      description || null,
    ],
  )
  const [[product]] = await pool.query(`SELECT ${productSelectFields} FROM products WHERE id = ?`, [result.insertId])
  res.status(201).json({ product: serializeProduct(product) })
})

router.put('/:id', adminRequired, productUpload.single('image'), async (req, res) => {
  const [[current]] = await pool.query('SELECT image FROM products WHERE id = ?', [req.params.id])
  if (!current) return res.status(404).json({ message: 'Product not found.' })

  const { name, brand, size, resolution, panel, is_curved, price, description } = req.body
  const uploadedImage = uploadedImagePayload(req.file)

  if (uploadedImage) {
    await pool.query(
      'UPDATE products SET name = ?, brand = ?, size = ?, resolution = ?, panel = ?, is_curved = ?, price = ?, image = ?, image_mime = ?, image_data = ?, description = ? WHERE id = ?',
      [name, brand, size, resolution, panel, is_curved ? 1 : 0, price, null, uploadedImage.mimeType, uploadedImage.data, description || null, req.params.id],
    )
  } else {
    await pool.query(
      'UPDATE products SET name = ?, brand = ?, size = ?, resolution = ?, panel = ?, is_curved = ?, price = ?, image = ?, description = ? WHERE id = ?',
      [name, brand, size, resolution, panel, is_curved ? 1 : 0, price, current.image, description || null, req.params.id],
    )
  }

  const [[product]] = await pool.query(`SELECT ${productSelectFields} FROM products WHERE id = ?`, [req.params.id])
  res.json({ product: serializeProduct(product) })
})

router.delete('/:id', adminRequired, async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = ?', [req.params.id])
  res.json({ message: 'Product deleted.' })
})

export default router
