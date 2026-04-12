import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { api, formatDate, money } from '../api'
import { useAuth } from '../state'

export function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    if (user) api.get('/orders/mine').then(({ data }) => setOrders(data.orders || []))
  }, [user])

  if (!user) return <Navigate to="/login" replace />

  return (
    <section className="page-shell">
      <div className="section-title">
        <span>Orders</span>
        <h1>My orders</h1>
      </div>

      <div className="table-card">
        {orders.length === 0 ? (
          <div className="empty-state">You do not have any orders yet.</div>
        ) : (
          <table>
            <thead><tr><th>Order ID</th><th>Created</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{money(order.total_price)}</td>
                  <td><Link to={`/orders/${order.id}`}>Details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export function OrderDetail() {
  const { user } = useAuth()
  const { id } = useParams()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin/')
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])

  useEffect(() => {
    if (user) {
      api.get(`/orders/${id}`).then(({ data }) => {
        setOrder(data.order)
        setItems(data.items || [])
      })
    }
  }, [id, user])

  if (!user) return <Navigate to={isAdminRoute ? '/admin/login' : '/login'} replace />
  if (isAdminRoute && user.role !== 'admin') return <Navigate to="/" replace />

  return (
    <section className={isAdminRoute ? '' : 'page-shell'}>
      <Link to={isAdminRoute ? '/admin/orders' : '/orders'} className="back-link">
        {isAdminRoute ? 'Back to admin orders' : 'Back to orders'}
      </Link>

      <div className="section-title">
        <span>Order #{id}</span>
        <h1>Order details</h1>
      </div>

      {!order ? (
        <div className="empty-state">Loading order...</div>
      ) : (
        <div className="table-card">
          <div className="summary-row"><span>Recipient</span><strong>{order.customer_name}</strong></div>
          <div className="summary-row"><span>Phone</span><strong>{order.customer_phone}</strong></div>
          <div className="summary-row"><span>Address</span><strong>{order.customer_address}</strong></div>
          <table>
            <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td>{item.qty}</td>
                  <td>{money(item.price * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="summary-row total"><span>Grand total</span><strong>{money(order.total_price)}</strong></div>
        </div>
      )}
    </section>
  )
}
