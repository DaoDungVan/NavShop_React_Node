import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, imageUrl, money } from '../api'
import { useCart } from '../state'

export default function ProductDetail() {
  const { id } = useParams()
  const { add } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => setProduct(data.product))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page-shell"><div className="empty-state">Loading product...</div></div>
  if (!product) return <div className="page-shell"><div className="empty-state">Product not found.</div></div>

  return (
    <section className="page-shell detail-layout">
      <div className="detail-image">
        <img src={imageUrl(product.image)} alt={product.name} />
      </div>

      <div className="detail-info">
        <Link to="/" className="back-link">Back to shop</Link>
        <span className="eyebrow">{product.brand}</span>
        <h1>{product.name}</h1>
        <p>{product.description || 'A balanced monitor for work, study, and entertainment.'}</p>

        <div className="spec-grid">
          <span><b>{product.size}</b> inch</span>
          <span><b>{product.resolution}</b> resolution</span>
          <span><b>{product.panel}</b> panel</span>
          <span><b>{product.is_curved ? 'Curved' : 'Flat'}</b> design</span>
        </div>

        <div className="detail-buy">
          <strong>{money(product.price)}</strong>
          <button className="solid-btn" onClick={() => add(product)}>Add to cart</button>
        </div>
      </div>
    </section>
  )
}
