import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api, formatDate, money } from '../api'
import { useAuth } from '../state'

export default function AdminOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    if (user?.role === 'admin') api.get('/orders/admin').then(({ data }) => setOrders(data.orders || []))
  }, [user])

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  return (
    <section className="page-shell admin-layout">
      <aside className="admin-sidebar">
        <Link to="/admin/products">Products</Link>
        <Link to="/admin/orders">Orders</Link>
        <Link to="/admin/chat">Live Chat</Link>
      </aside>
      <div>
        <div className="section-title">
          <span>Admin</span>
          <h1>Đơn hàng</h1>
        </div>
        <div className="table-card">
          <table>
            <thead><tr><th>Mã</th><th>Khách</th><th>Ngày</th><th>Tổng</th><th></th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer_name || order.user_name || 'Guest'}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{money(order.total_price)}</td>
                  <td><Link to={`/orders/${order.id}`}>Chi tiết</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
