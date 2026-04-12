import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, money } from '../api'

export default function AdminOverview() {
  const [stats, setStats] = useState({ products: 0, orders: 0, brands: 0, revenue: 0 })

  useEffect(() => {
    Promise.all([api.get('/products'), api.get('/orders/admin')]).then(([productsRes, ordersRes]) => {
      const products = productsRes.data.products || []
      const orders = ordersRes.data.orders || []
      const brands = new Set(products.map((item) => item.brand)).size
      const revenue = orders.reduce((sum, item) => sum + Number(item.total_price || 0), 0)
      setStats({ products: products.length, orders: orders.length, brands, revenue })
    })
  }, [])

  return (
    <section>
      <div className="section-title">
        <span>Admin</span>
        <h1>Store overview</h1>
      </div>

      <div className="overview-grid">
        <article className="overview-card">
          <strong>{stats.products}</strong>
          <span>Live products</span>
        </article>
        <article className="overview-card">
          <strong>{stats.orders}</strong>
          <span>Orders received</span>
        </article>
        <article className="overview-card">
          <strong>{stats.brands}</strong>
          <span>Active brands</span>
        </article>
        <article className="overview-card">
          <strong>{money(stats.revenue)}</strong>
          <span>Total recorded revenue</span>
        </article>
      </div>

      <div className="overview-links">
        <Link className="solid-btn" to="/admin/products">Manage products</Link>
        <Link className="ghost-btn" to="/admin/orders">View orders</Link>
        <Link className="ghost-btn" to="/admin/chat">Open chat desk</Link>
      </div>
    </section>
  )
}
