import { Link, useParams } from 'react-router-dom'

export default function CheckoutSuccess() {
  const { id } = useParams()

  return (
    <section className="page-shell narrow-page">
      <div className="success-box">
        <span className="eyebrow">Order created</span>
        <h1>Đặt hàng thành công</h1>
        <p>Mã đơn của bạn là #{id}. Admin sẽ liên hệ theo số điện thoại trong thông tin giao hàng.</p>
        <div className="hero-actions">
          <Link className="solid-btn" to="/">Tiếp tục mua sắm</Link>
          <Link className="ghost-btn" to="/login">Đăng nhập để xem đơn</Link>
        </div>
      </div>
    </section>
  )
}
