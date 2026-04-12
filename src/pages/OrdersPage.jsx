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
        <h1>Don hang cua toi</h1>
      </div>

      <div className="table-card">
        {orders.length === 0 ? (
          <div className="empty-state">Ban chua co don hang.</div>
        ) : (
          <table>
            <thead><tr><th>Ma don</th><th>Ngay tao</th><th>Tong tien</th><th></th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{money(order.total_price)}</td>
                  <td><Link to={`/orders/${order.id}`}>Chi tiet</Link></td>
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
        {isAdminRoute ? 'Ve danh sach don quan tri' : 'Ve danh sach don'}
      </Link>

      <div className="section-title">
        <span>Order #{id}</span>
        <h1>Chi tiet don hang</h1>
      </div>

      {!order ? (
        <div className="empty-state">Dang tai don hang...</div>
      ) : (
        <div className="table-card">
          <div className="summary-row"><span>Nguoi nhan</span><strong>{order.customer_name}</strong></div>
          <div className="summary-row"><span>So dien thoai</span><strong>{order.customer_phone}</strong></div>
          <div className="summary-row"><span>Dia chi</span><strong>{order.customer_address}</strong></div>
          <table>
            <thead><tr><th>San pham</th><th>SL</th><th>Gia</th></tr></thead>
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
          <div className="summary-row total"><span>Tong cong</span><strong>{money(order.total_price)}</strong></div>
        </div>
      )}
    </section>
  )
}
