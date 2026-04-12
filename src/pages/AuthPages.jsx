import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../state'

function AuthLayout({ title, subtitle, backTo = '/', backLabel = 'Back to home', children }) {
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
        <h1>Your next monitor, set up the right way.</h1>
        <p>Sign in to track orders, update your profile, and get faster support through live chat.</p>
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
      setError(err.response?.data?.message || 'Unable to sign in.')
    }
  }

  return (
    <AuthLayout title="Login" subtitle="Use your account to continue shopping.">
      <form className="form-stack" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}
        <label>Email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required /></label>
        <label>Password<input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" required /></label>
        <button className="solid-btn">Sign in</button>
      </form>
      <p className="auth-switch">No account yet? <Link to="/register">Create one</Link></p>
      <p className="auth-switch">Are you an admin? <Link to="/admin/login">Open admin login</Link></p>
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
      setError(err.response?.data?.message || 'Unable to create your account.')
    }
  }

  return (
    <AuthLayout title="Register" subtitle="Create an account for faster checkout and order history.">
      <form className="form-stack" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}
        <label>Full name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required /></label>
        <label>Password<input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" minLength="6" required /></label>
        <button className="solid-btn">Create account</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
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
        setError('This account does not have admin access.')
        return
      }
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in to the admin area.')
    }
  }

  return (
    <AuthLayout
      title="Admin Login"
      subtitle="Sign in to manage products, orders, analytics, and live chat."
      backTo="/login"
      backLabel="Back to customer login"
    >
      <form className="form-stack" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}
        <label>Admin email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required /></label>
        <label>Password<input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" required /></label>
        <button className="solid-btn">Open admin panel</button>
      </form>
    </AuthLayout>
  )
}
