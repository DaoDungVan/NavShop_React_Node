import express from 'express'
import { pool } from '../db.js'
import { adminRequired, authOptional, authRequired } from '../middleware/auth.js'

const router = express.Router()

router.post('/', authOptional, async (req, res) => {
  const { items = [], customer = {} } = req.body

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(422).json({ message: 'Cart is empty.' })
  }

  const ids = items.map((item) => Number(item.product_id || item.id)).filter(Boolean)
  if (ids.length === 0) {
    return res.status(422).json({ message: 'Cart is invalid.' })
  }

  const [products] = await pool.query(`SELECT * FROM products WHERE id IN (${ids.map(() => '?').join(',')})`, ids)
  const byId = new Map(products.map((product) => [Number(product.id), product]))

  let total = 0
  const orderItems = []

  for (const item of items) {
    const product = byId.get(Number(item.product_id || item.id))
    const qty = Math.max(1, Number(item.qty || 1))
    if (!product) continue
    total += product.price * qty
    orderItems.push([product.id, product.name, product.price, qty])
  }

  if (orderItems.length === 0) {
    return res.status(422).json({ message: 'No valid products in cart.' })
  }

  const [orderResult] = await pool.query(
    'INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_price) VALUES (?, ?, ?, ?, ?)',
    [
      req.user?.id || null,
      customer.name || req.user?.name || 'Guest',
      customer.phone || null,
      customer.address || null,
      total,
    ],
  )

  const values = orderItems.map((item) => [orderResult.insertId, ...item])
  await pool.query(
    'INSERT INTO order_items (order_id, product_id, product_name, price, qty) VALUES ?',
    [values],
  )

  res.status(201).json({ orderId: orderResult.insertId, total })
})

router.get('/mine', authRequired, async (req, res) => {
  const [orders] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [req.user.id])
  res.json({ orders })
})

router.get('/admin', adminRequired, async (_req, res) => {
  const [orders] = await pool.query(`
    SELECT o.*, u.name AS user_name, u.email AS user_email
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    ORDER BY o.id DESC
  `)
  res.json({ orders })
})

router.get('/:id', authRequired, async (req, res) => {
  const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id])
  if (!order) return res.status(404).json({ message: 'Order not found.' })

  if (req.user.role !== 'admin' && Number(order.user_id) !== Number(req.user.id)) {
    return res.status(403).json({ message: 'Forbidden.' })
  }

  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id])
  res.json({ order, items })
})

export default router
