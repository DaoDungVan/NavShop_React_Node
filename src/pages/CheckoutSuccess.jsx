import { Link, useParams } from 'react-router-dom'

export default function CheckoutSuccess() {
  const { id } = useParams()

  return (
    <section className="page-shell narrow-page">
      <div className="success-box">
        <span className="eyebrow">Order created</span>
        <h1>Dat hang thanh cong</h1>
        <p>Ma don cua ban la #{id}. Admin se lien he theo so dien thoai trong thong tin giao hang.</p>
        <div className="hero-actions">
          <Link className="solid-btn" to="/">Tiep tuc mua sam</Link>
          <Link className="ghost-btn" to="/login">Dang nhap de xem don</Link>
        </div>
      </div>
    </section>
  )
}
