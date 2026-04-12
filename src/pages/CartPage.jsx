import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, imageUrl, money } from '../api'
import { useAuth, useCart } from '../state'

export default function CartPage() {
  const { user } = useAuth()
  const cart = useCart()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  })
  const [error, setError] = useState('')

  async function checkout(event) {
    event.preventDefault()
    setError('')

    try {
      const { data } = await api.post('/orders', {
        items: cart.items.map((item) => ({ product_id: item.id, qty: item.qty })),
        customer,
      })
      cart.clear()
      navigate(user ? `/orders/${data.orderId}` : `/checkout-success/${data.orderId}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Khong tao duoc don hang.')
    }
  }

  return (
    <section className="page-shell cart-layout">
      <div>
        <div className="section-title">
          <span>Cart</span>
          <h1>Gio hang cua ban</h1>
        </div>

        {cart.items.length === 0 ? (
          <div className="empty-state">
            Gio hang dang trong. <Link to="/">Tiep tuc mua sam</Link>
          </div>
        ) : (
          <div className="cart-list">
            {cart.items.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={imageUrl(item.image)} alt={item.name} />
                <div>
                  <strong>{item.name}</strong>
                  <span>{money(item.price)}</span>
                </div>
                <input type="number" min="1" value={item.qty} onChange={(event) => cart.changeQty(item.id, event.target.value)} />
                <button onClick={() => cart.remove(item.id)}>Xoa</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="checkout-box">
        <h2>Checkout</h2>
        <div className="summary-row"><span>Tong tien</span><strong>{money(cart.total)}</strong></div>

        <form className="form-stack" onSubmit={checkout}>
          {error && <div className="alert">{error}</div>}
          <label>Nguoi nhan<input value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} required /></label>
          <label>So dien thoai<input value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} required /></label>
          <label>Dia chi<textarea value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} required /></label>
          <button className="solid-btn" disabled={cart.items.length === 0}>Dat hang</button>
        </form>
      </aside>
    </section>
  )
}
