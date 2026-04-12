import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import { AdminLogin, Login, Register } from './pages/AuthPages'
import CartPage from './pages/CartPage'
import ProfilePage from './pages/ProfilePage'
import { OrderDetail, OrdersPage } from './pages/OrdersPage'
import CheckoutSuccess from './pages/CheckoutSuccess'
import AdminProducts from './pages/AdminProducts'
import AdminOrders from './pages/AdminOrders'
import AdminChat from './pages/AdminChat'
import AdminOverview from './pages/AdminOverview'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/checkout-success/:id" element={<CheckoutSuccess />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="chat" element={<AdminChat />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
