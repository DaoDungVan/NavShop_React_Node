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
          <h1>Chọn màn hình đúng nhu cầu, đặt hàng trong vài bước.</h1>
          <p>Gaming tốc độ cao, OLED màu sâu, màn hình đồ họa chuẩn màu và lựa chọn văn phòng gọn bàn.</p>
          <div className="hero-actions">
            <a href="#products" className="solid-btn">Xem sản phẩm</a>
            <Link to="/cart" className="ghost-btn light">Kiểm tra giỏ hàng</Link>
          </div>
        </div>
        <div className="hero-showcase">
          <img src="/uploads/products/1770144249_asus_pg27aqwp-w_gearvn_ffffe2baa33b4f9092cbe4b7c94a4399_master.jpg" alt="OLED gaming monitor" />
        </div>
      </section>

      <section className="feature-strip">
        <div><strong>2H</strong><span>Tư vấn phản hồi nhanh</span></div>
        <div><strong>24M</strong><span>Bảo hành chính hãng</span></div>
        <div><strong>0%</strong><span>Hỗ trợ trả góp</span></div>
      </section>

      <section id="products" className="shop-section">
        <div className="section-title">
          <span>Catalog</span>
          <h2>Màn hình nổi bật</h2>
        </div>

        <div className="filter-bar">
          <input name="keyword" value={filters.keyword} onChange={updateFilter} placeholder="Tìm theo tên màn hình" />
          <select name="brand" value={filters.brand} onChange={updateFilter}>
            <option value="">Tất cả hãng</option>
            {brands.map((brand) => <option value={brand} key={brand}>{brand}</option>)}
          </select>
          <select name="size" value={filters.size} onChange={updateFilter}>
            <option value="">Kích thước</option>
            <option value="24">24 inch</option>
            <option value="27">27 inch</option>
            <option value="32">32 inch</option>
          </select>
          <select name="resolution" value={filters.resolution} onChange={updateFilter}>
            <option value="">Độ phân giải</option>
            <option value="FHD">FHD</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
          <select name="panel" value={filters.panel} onChange={updateFilter}>
            <option value="">Tấm nền</option>
            <option value="IPS">IPS</option>
            <option value="VA">VA</option>
            <option value="OLED">OLED</option>
          </select>
          <select name="sort_price" value={filters.sort_price} onChange={updateFilter}>
            <option value="">Sắp xếp</option>
            <option value="asc">Giá tăng</option>
            <option value="desc">Giá giảm</option>
          </select>
          <button onClick={() => setFilters(defaultFilters)}>Reset</button>
        </div>

        {loading ? (
          <div className="empty-state">Đang tải sản phẩm...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">Không tìm thấy sản phẩm phù hợp.</div>
        ) : (
          <div className="product-grid">
            {products.map((product) => <ProductCard product={product} key={product.id} />)}
          </div>
        )}
      </section>
    </div>
  )
}
