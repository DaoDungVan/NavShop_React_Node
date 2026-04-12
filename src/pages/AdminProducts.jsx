import { useEffect, useState } from 'react'
import { api, imageUrl, money } from '../api'

const emptyForm = {
  name: '',
  brand: '',
  size: 27,
  resolution: '2K',
  panel: 'IPS',
  is_curved: false,
  price: '',
  description: '',
  image: null,
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const { data } = await api.get('/products')
    setProducts(data.products || [])
  }

  useEffect(() => {
    load()
  }, [])

  function edit(product) {
    setEditing(product.id)
    setForm({
      name: product.name,
      brand: product.brand,
      size: product.size,
      resolution: product.resolution,
      panel: product.panel,
      is_curved: Boolean(product.is_curved),
      price: product.price,
      description: product.description || '',
      image: null,
    })
    setMessage('')
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'image' && !value) return
      body.append(key, key === 'is_curved' ? (value ? '1' : '') : value)
    })

    try {
      if (editing) await api.put(`/products/${editing}`, body)
      else await api.post('/products', body)
      setForm(emptyForm)
      setEditing(null)
      setMessage(editing ? 'Da cap nhat san pham.' : 'Da them san pham.')
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Khong luu duoc san pham.')
    }
  }

  async function remove(id) {
    setMessage('')
    setError('')
    try {
      await api.delete(`/products/${id}`)
      setMessage('Da xoa san pham.')
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Khong xoa duoc san pham.')
    }
  }

  return (
    <section>
      <div className="section-title">
        <span>Admin</span>
        <h1>Quan ly san pham</h1>
      </div>

      <form className="admin-form" onSubmit={submit}>
        {message && <div className="notice">{message}</div>}
        {error && <div className="alert">{error}</div>}
        <input placeholder="Ten san pham" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <input placeholder="Hang" value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} required />
        <input type="number" placeholder="Size" value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} required />
        <select value={form.resolution} onChange={(event) => setForm({ ...form, resolution: event.target.value })}>
          <option>FHD</option><option>2K</option><option>4K</option>
        </select>
        <select value={form.panel} onChange={(event) => setForm({ ...form, panel: event.target.value })}>
          <option>IPS</option><option>VA</option><option>OLED</option>
        </select>
        <input type="number" placeholder="Gia" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
        <textarea placeholder="Mo ta" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <label className="inline-check"><input type="checkbox" checked={form.is_curved} onChange={(event) => setForm({ ...form, is_curved: event.target.checked })} /> Man hinh cong</label>
        <input type="file" accept="image/*" onChange={(event) => setForm({ ...form, image: event.target.files?.[0] })} />
        <button className="solid-btn">{editing ? 'Cap nhat' : 'Them san pham'}</button>
        {editing && <button type="button" className="ghost-btn" onClick={() => { setEditing(null); setForm(emptyForm) }}>Huy</button>}
      </form>

      <div className="admin-grid">
        {products.map((product) => (
          <article className="admin-product" key={product.id}>
            <img src={imageUrl(product.image)} alt={product.name} />
            <div>
              <strong>{product.name}</strong>
              <span>{money(product.price)}</span>
            </div>
            <button onClick={() => edit(product)}>Sua</button>
            <button onClick={() => remove(product.id)}>Xoa</button>
          </article>
        ))}
      </div>
    </section>
  )
}
