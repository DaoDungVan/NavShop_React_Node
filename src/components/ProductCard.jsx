import { Link } from 'react-router-dom'
import { imageUrl, money } from '../api'
import { useCart } from '../state'

export default function ProductCard({ product }) {
  const { add } = useCart()

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-image">
        <img src={imageUrl(product.image)} alt={product.name} />
      </Link>
      <div className="product-body">
        <div className="tag-row">
          <span>{product.brand}</span>
          <span>{product.size} inch</span>
          <span>{product.resolution}</span>
        </div>
        <Link to={`/products/${product.id}`} className="product-title">{product.name}</Link>
        <p>{product.panel} panel {product.is_curved ? 'curved' : 'flat'} display</p>
        <div className="product-foot">
          <strong>{money(product.price)}</strong>
          <button onClick={() => add(product)}>Add cart</button>
        </div>
      </div>
    </article>
  )
}
