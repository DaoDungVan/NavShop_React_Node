import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
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

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <div>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">NavShop Monitor</span>
          <h1>Chon man hinh dung nhu cau, dat hang trong vai buoc.</h1>
          <p>Gaming toc do cao, OLED mau sau, man hinh do hoa chuan mau va lua chon van phong gon ban.</p>
          <div className="hero-actions">
            <a href="#products" className="solid-btn">Xem san pham</a>
            <Link to="/cart" className="ghost-btn light">Kiem tra gio hang</Link>
          </div>
        </div>
        <div className="hero-showcase">
          <img src="/uploads/products/1770144249_asus_pg27aqwp-w_gearvn_ffffe2baa33b4f9092cbe4b7c94a4399_master.jpg" alt="OLED gaming monitor" />
        </div>
      </section>

      <section className="feature-strip">
        <div><strong>2H</strong><span>Tu van phan hoi nhanh</span></div>
        <div><strong>24M</strong><span>Bao hanh chinh hang</span></div>
        <div><strong>0%</strong><span>Ho tro tra gop</span></div>
      </section>

      <section id="products" className="shop-section">
        <div className="section-title">
          <span>Catalog</span>
          <h2>Man hinh noi bat</h2>
        </div>

        <div className="filter-bar">
          <input name="keyword" value={filters.keyword} onChange={updateFilter} placeholder="Tim theo ten man hinh" />
          <select name="brand" value={filters.brand} onChange={updateFilter}>
            <option value="">Tat ca hang</option>
            {brands.map((brand) => <option value={brand} key={brand}>{brand}</option>)}
          </select>
          <select name="size" value={filters.size} onChange={updateFilter}>
            <option value="">Kich thuoc</option>
            <option value="24">24 inch</option>
            <option value="27">27 inch</option>
            <option value="32">32 inch</option>
          </select>
          <select name="resolution" value={filters.resolution} onChange={updateFilter}>
            <option value="">Do phan giai</option>
            <option value="FHD">FHD</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
          <select name="panel" value={filters.panel} onChange={updateFilter}>
            <option value="">Tam nen</option>
            <option value="IPS">IPS</option>
            <option value="VA">VA</option>
            <option value="OLED">OLED</option>
          </select>
          <select name="sort_price" value={filters.sort_price} onChange={updateFilter}>
            <option value="">Sap xep</option>
            <option value="asc">Gia tang</option>
            <option value="desc">Gia giam</option>
          </select>
          <button onClick={() => setFilters(defaultFilters)}>Reset</button>
        </div>

        {loading ? (
          <div className="empty-state">Dang tai san pham...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">Khong tim thay san pham phu hop.</div>
        ) : (
          <div className="product-grid">
            {products.map((product) => <ProductCard product={product} key={product.id} />)}
          </div>
        )}
      </section>
    </div>
  )
}
