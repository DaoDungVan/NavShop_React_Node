import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth, useCart } from '../state'
import ChatWidget from './ChatWidget'

export default function Layout() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <>
      <header className="site-header">
        <div className="top-strip">
          <span>Miễn phí giao hàng nội thành cho đơn từ 5 triệu</span>
          <span>Hotline: 0909 888 777</span>
        </div>
        <div className="nav-wrap">
          <Link to="/" className="brand">
            <span className="brand-mark">N</span>
            <span>
              <strong>NavShop</strong>
              <small>Monitor store</small>
            </span>
          </Link>

          <nav className="main-nav">
            <NavLink to="/">Shop</NavLink>
            <NavLink to="/cart">Cart {count > 0 && <b>{count}</b>}</NavLink>
            {user && <NavLink to="/orders">My Orders</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin/products">Admin</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin/chat">Live Chat</NavLink>}
          </nav>

          <div className="user-actions">
            {user ? (
              <>
                <Link to="/profile" className="user-chip">{user.name}</Link>
                <button className="ghost-btn" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link className="ghost-btn" to="/login">Login</Link>
                <Link className="solid-btn" to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div>
          <strong>NavShop</strong>
          <p>Màn hình gaming, đồ họa và văn phòng cho góc setup gọn hơn.</p>
        </div>
        <div>
          <span>Support</span>
          <span>Warranty</span>
          <span>Shipping</span>
        </div>
      </footer>

      <ChatWidget />
    </>
  )
}
