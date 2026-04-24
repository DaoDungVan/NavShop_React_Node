import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, imageUrl } from '../api'
import ProductCard from '../components/ProductCard'

const defaultFilters = {
  keyword: '',
  brand: '',
  size: '',
  resolution: '',
  panel: '',
  sort_price: '',
}

export default function Home() {
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState(defaultFilters)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
    setLoading(true)
    api.get('/products', { params })
      .then(({ data }) => setProducts(data.products || []))
      .finally(() => setLoading(false))
  }, [filters])

  const brands = useMemo(() => [...new Set(products.map((item) => item.brand))].sort(), [products])
  const heroProduct = useMemo(
    () => products.find((item) => item.name.includes('PG27AQWP')) || products[0] || null,
    [products],
  )

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <div>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">NavShop Monitor</span>
          <h1>Choose the right monitor for your setup in just a few steps.</h1>
          <p>High refresh gaming panels, color-accurate design displays, and clean office picks in one catalog.</p>
          <div className="hero-actions">
            <a href="#products" className="solid-btn">Browse products</a>
            <Link to="/cart" className="ghost-btn light">View cart</Link>
          </div>
        </div>
        <div className="hero-showcase">
          <img src={imageUrl(heroProduct?.image)} alt={heroProduct?.name || 'OLED gaming monitor'} />
        </div>
      </section>

      <section className="feature-strip">
        <div><strong>2H</strong><span>Fast support response</span></div>
        <div><strong>24M</strong><span>Official warranty</span></div>
        <div><strong>0%</strong><span>Installment support</span></div>
      </section>

      <section id="products" className="shop-section">
        <div className="section-title">
          <span>Catalog</span>
          <h2>Featured monitors</h2>
        </div>

        <div className="filter-bar">
          <input name="keyword" value={filters.keyword} onChange={updateFilter} placeholder="Search by monitor name" />
          <select name="brand" value={filters.brand} onChange={updateFilter}>
            <option value="">All brands</option>
            {brands.map((brand) => <option value={brand} key={brand}>{brand}</option>)}
          </select>
          <select name="size" value={filters.size} onChange={updateFilter}>
            <option value="">Size</option>
            <option value="24">24 inch</option>
            <option value="27">27 inch</option>
            <option value="32">32 inch</option>
          </select>
          <select name="resolution" value={filters.resolution} onChange={updateFilter}>
            <option value="">Resolution</option>
            <option value="FHD">FHD</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
          <select name="panel" value={filters.panel} onChange={updateFilter}>
            <option value="">Panel</option>
            <option value="IPS">IPS</option>
            <option value="VA">VA</option>
            <option value="OLED">OLED</option>
          </select>
          <select name="sort_price" value={filters.sort_price} onChange={updateFilter}>
            <option value="">Sort</option>
            <option value="asc">Price low to high</option>
            <option value="desc">Price high to low</option>
          </select>
          <button onClick={() => setFilters(defaultFilters)}>Reset</button>
        </div>

        {loading ? (
          <div className="empty-state">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">No products match your filters.</div>
        ) : (
          <div className="product-grid">
            {products.map((product) => <ProductCard product={product} key={product.id} />)}
          </div>
        )}
      </section>
    </div>
  )
}
