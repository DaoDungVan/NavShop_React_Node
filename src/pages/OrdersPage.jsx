import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
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
        <h1>Đơn hàng của tôi</h1>
      </div>
      <div className="table-card">
        {orders.length === 0 ? <div className="empty-state">Bạn chưa có đơn hàng.</div> : (
          <table>
            <thead><tr><th>Mã đơn</th><th>Ngày tạo</th><th>Tổng tiền</th><th></th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{money(order.total_price)}</td>
                  <td><Link to={`/orders/${order.id}`}>Chi tiết</Link></td>
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

  if (!user) return <Navigate to="/login" replace />

  return (
    <section className="page-shell">
      <Link to="/orders" className="back-link">Về danh sách đơn</Link>
      <div className="section-title">
        <span>Order #{id}</span>
        <h1>Chi tiết đơn hàng</h1>
      </div>
      {!order ? <div className="empty-state">Đang tải đơn hàng...</div> : (
        <div className="table-card">
          <div className="summary-row"><span>Người nhận</span><strong>{order.customer_name}</strong></div>
          <div className="summary-row"><span>Số điện thoại</span><strong>{order.customer_phone}</strong></div>
          <div className="summary-row"><span>Địa chỉ</span><strong>{order.customer_address}</strong></div>
          <table>
            <thead><tr><th>Sản phẩm</th><th>SL</th><th>Giá</th></tr></thead>
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
          <div className="summary-row total"><span>Tổng cộng</span><strong>{money(order.total_price)}</strong></div>
        </div>
      )}
    </section>
  )
}
