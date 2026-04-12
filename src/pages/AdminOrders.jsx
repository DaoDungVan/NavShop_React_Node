import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatDate, money } from '../api'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    api.get('/orders/admin').then(({ data }) => setOrders(data.orders || []))
  }, [])

  return (
    <section>
      <div className="section-title">
        <span>Admin</span>
        <h1>Orders</h1>
      </div>

      <div className="table-card">
        <table>
          <thead><tr><th>ID</th><th>Customer</th><th>Date</th><th>Total</th><th></th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.customer_name || order.user_name || 'Guest'}</td>
                <td>{formatDate(order.created_at)}</td>
                <td>{money(order.total_price)}</td>
                <td><Link to={`/admin/orders/${order.id}`}>Details</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
