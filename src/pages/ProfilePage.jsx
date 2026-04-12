import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api, imageUrl } from '../api'
import { useAuth } from '../state'

export default function ProfilePage() {
  const { user, saveSession } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    gender: user?.gender || '',
    avatar: null,
  })

  if (!user) return <Navigate to="/login" replace />

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    const body = new FormData()
    body.append('name', form.name)
    body.append('phone', form.phone)
    body.append('address', form.address)
    body.append('gender', form.gender)
    if (form.avatar) body.append('avatar', form.avatar)

    try {
      const { data } = await api.put('/auth/profile', body)
      saveSession(data)
      setMessage('Da cap nhat ho so.')
    } catch (err) {
      setError(err.response?.data?.message || 'Khong cap nhat duoc ho so.')
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    try {
      await api.put('/auth/password', passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '' })
      setPasswordMessage('Da doi mat khau.')
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Khong doi duoc mat khau.')
    }
  }

  return (
    <section className="page-shell profile-layout">
      <aside className="profile-card">
        <img src={imageUrl(user.avatar)} alt={user.name} />
        <h1>{user.name}</h1>
        <p>{user.email}</p>
        <Link to="/" className="back-link">Ve trang chu</Link>
      </aside>

      <div className="profile-panel">
        <div className="section-title">
          <span>Account</span>
          <h2>Cap nhat thong tin</h2>
        </div>

        <form className="form-stack" onSubmit={submit}>
          {message && <div className="notice">{message}</div>}
          {error && <div className="alert">{error}</div>}
          <label>Ho va ten<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label>So dien thoai<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          <label>Dia chi<textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
          <label>Gioi tinh
            <select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
              <option value="">Khong chon</option>
              <option value="male">Nam</option>
              <option value="female">Nu</option>
              <option value="other">Khac</option>
            </select>
          </label>
          <label>Anh dai dien<input type="file" accept="image/*" onChange={(event) => setForm({ ...form, avatar: event.target.files?.[0] })} /></label>
          <button className="solid-btn">Luu thay doi</button>
        </form>

        <div className="section-title sub-title">
          <span>Security</span>
          <h2>Doi mat khau</h2>
        </div>

        <form className="form-stack" onSubmit={changePassword}>
          {passwordMessage && <div className="notice">{passwordMessage}</div>}
          {passwordError && <div className="alert">{passwordError}</div>}
          <label>Mat khau hien tai<input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} required /></label>
          <label>Mat khau moi<input type="password" minLength="6" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} required /></label>
          <button className="ghost-btn">Doi mat khau</button>
        </form>
      </div>
    </section>
  )
}
