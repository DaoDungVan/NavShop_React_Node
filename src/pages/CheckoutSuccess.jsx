import { Link, useParams } from 'react-router-dom'

export default function CheckoutSuccess() {
  const { id } = useParams()

  return (
    <section className="page-shell narrow-page">
      <div className="success-box">
        <span className="eyebrow">Order created</span>
        <h1>Your order has been placed.</h1>
        <p>Your order number is #{id}. Our team will contact you using the phone number from the delivery details.</p>
        <div className="hero-actions">
          <Link className="solid-btn" to="/">Continue shopping</Link>
          <Link className="ghost-btn" to="/login">Sign in to view orders</Link>
        </div>
      </div>
    </section>
  )
}
