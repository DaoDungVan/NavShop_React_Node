import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../state'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return <Navigate to="/admin/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-mark">N</span>
          <div>
            <strong>NavShop Admin</strong>
            <small>Management panel</small>
          </div>
        </div>

        <nav className="admin-menu">
          <NavLink end to="/admin">Overview</NavLink>
          <NavLink to="/admin/products">Products</NavLink>
          <NavLink to="/admin/orders">Orders</NavLink>
          <NavLink to="/admin/chat">Chat</NavLink>
        </nav>

        <button className="ghost-btn admin-logout" onClick={handleLogout}>Log out</button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <strong>Hello, {user.name}</strong>
            <span>NavShop admin workspace</span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
