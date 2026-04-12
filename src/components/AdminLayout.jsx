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
          <NavLink end to="/admin">Tong quan</NavLink>
          <NavLink to="/admin/products">San pham</NavLink>
          <NavLink to="/admin/orders">Don hang</NavLink>
        </nav>

        <button className="ghost-btn admin-logout" onClick={handleLogout}>Dang xuat</button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <strong>Xin chao, {user.name}</strong>
            <span>Khu vuc quan tri NavShop</span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
