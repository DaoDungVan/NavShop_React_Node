import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../state'

function AuthLayout({ title, subtitle, children }) {
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
        <h1>Màn hình mới cho góc setup gọn hơn.</h1>
        <p>Đăng nhập để theo dõi đơn hàng, cập nhật hồ sơ và nhận hỗ trợ nhanh qua live chat.</p>
      </div>
      <div className="auth-card">
        <Link to="/" className="back-link">Về trang chủ</Link>
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

  if (user) return <Navigate to="/" replace />

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      const nextUser = await login(form)
      navigate(nextUser.role === 'admin' ? '/admin/products' : '/')
    } catch (err) {
      setError(err.response?.data?.message || 'Không đăng nhập được.')
    }
  }

  return (
    <AuthLayout title="Login" subtitle="Dùng tài khoản của bạn để tiếp tục.">
      <form className="form-stack" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}
        <label>Email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required /></label>
        <label>Password<input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" required /></label>
        <button className="solid-btn">Login</button>
      </form>
      <p className="auth-switch">Chưa có tài khoản? <Link to="/register">Register</Link></p>
    </AuthLayout>
  )
}

export function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Không tạo được tài khoản.')
    }
  }

  return (
    <AuthLayout title="Register" subtitle="Tạo tài khoản để checkout và xem đơn hàng.">
      <form className="form-stack" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}
        <label>Full name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required /></label>
        <label>Password<input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" minLength="6" required /></label>
        <button className="solid-btn">Register</button>
      </form>
      <p className="auth-switch">Đã có tài khoản? <Link to="/login">Login</Link></p>
    </AuthLayout>
  )
}
