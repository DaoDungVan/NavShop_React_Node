import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../state'

function AuthLayout({ title, subtitle, backTo = '/', backLabel = 'Ve trang chu', children }) {
  return (
    <section className="auth-page">
      <div className="auth-art">
        <Link to="/" className="brand auth-brand">
          <span className="brand-mark">N</span>
          <span>
            <strong>NavShop</strong>
            <small>Monitor store</small>
          </span>
        </Link>
        <h1>Man hinh moi cho goc setup gon hon.</h1>
        <p>Dang nhap de theo doi don hang, cap nhat ho so va nhan ho tro nhanh qua live chat.</p>
      </div>

      <div className="auth-card">
        <Link to={backTo} className="back-link">{backLabel}</Link>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        {children}
      </div>
    </section>
  )
}

export function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />

  async function submit(event) {
    event.preventDefault()
    setError('')

    try {
      const nextUser = await login(form)
      navigate(nextUser.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err.response?.data?.message || 'Khong dang nhap duoc.')
    }
  }

  return (
    <AuthLayout title="Login" subtitle="Dung tai khoan cua ban de tiep tuc mua sam.">
      <form className="form-stack" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}
        <label>Email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required /></label>
        <label>Password<input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" required /></label>
        <button className="solid-btn">Dang nhap</button>
      </form>
      <p className="auth-switch">Chua co tai khoan? <Link to="/register">Tao tai khoan</Link></p>
      <p className="auth-switch">Ban la quan tri vien? <Link to="/admin/login">Vao khu quan tri</Link></p>
    </AuthLayout>
  )
}

export function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />

  async function submit(event) {
    event.preventDefault()
    setError('')

    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Khong tao duoc tai khoan.')
    }
  }

  return (
    <AuthLayout title="Register" subtitle="Tao tai khoan de checkout nhanh va xem lich su don hang.">
      <form className="form-stack" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}
        <label>Ho va ten<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required /></label>
        <label>Mat khau<input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" minLength="6" required /></label>
        <button className="solid-btn">Tao tai khoan</button>
      </form>
      <p className="auth-switch">Da co tai khoan? <Link to="/login">Dang nhap</Link></p>
    </AuthLayout>
  )
}

export function AdminLogin() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  if (user?.role === 'user') return <Navigate to="/" replace />

  async function submit(event) {
    event.preventDefault()
    setError('')

    try {
      const nextUser = await login(form)
      if (nextUser.role !== 'admin') {
        logout()
        setError('Tai khoan nay khong co quyen quan tri.')
        return
      }
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message || 'Khong dang nhap duoc vao khu quan tri.')
    }
  }

  return (
    <AuthLayout
      title="Admin Login"
      subtitle="Dang nhap de quan ly san pham, don hang va live chat."
      backTo="/login"
      backLabel="Ve dang nhap khach hang"
    >
      <form className="form-stack" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}
        <label>Email quan tri<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required /></label>
        <label>Mat khau<input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" required /></label>
        <button className="solid-btn">Vao khu quan tri</button>
      </form>
    </AuthLayout>
  )
}
