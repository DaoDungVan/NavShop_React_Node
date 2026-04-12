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
      setMessage('Profile updated.')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update the profile.')
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    try {
      await api.put('/auth/password', passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '' })
      setPasswordMessage('Password updated.')
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Unable to change the password.')
    }
  }

  return (
    <section className="page-shell profile-layout">
      <aside className="profile-card">
        <img src={imageUrl(user.avatar)} alt={user.name} />
        <h1>{user.name}</h1>
        <p>{user.email}</p>
        <Link to="/" className="back-link">Back to home</Link>
      </aside>

      <div className="profile-panel">
        <div className="section-title">
          <span>Account</span>
          <h2>Update profile</h2>
        </div>

        <form className="form-stack" onSubmit={submit}>
          {message && <div className="notice">{message}</div>}
          {error && <div className="alert">{error}</div>}
          <label>Full name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label>Phone number<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          <label>Address<textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
          <label>Gender
            <select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Avatar image<input type="file" accept="image/*" onChange={(event) => setForm({ ...form, avatar: event.target.files?.[0] })} /></label>
          <button className="solid-btn">Save changes</button>
        </form>

        <div className="section-title sub-title">
          <span>Security</span>
          <h2>Change password</h2>
        </div>

        <form className="form-stack" onSubmit={changePassword}>
          {passwordMessage && <div className="notice">{passwordMessage}</div>}
          {passwordError && <div className="alert">{passwordError}</div>}
          <label>Current password<input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} required /></label>
          <label>New password<input type="password" minLength="6" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} required /></label>
          <button className="ghost-btn">Update password</button>
        </form>
      </div>
    </section>
  )
}
