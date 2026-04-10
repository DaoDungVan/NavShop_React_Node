import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, setAuthToken } from './api'

const AuthContext = createContext(null)
const CartContext = createContext(null)

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('navshop_token') || '')
  const [user, setUser] = useState(() => readStorage('navshop_user', null))

  useEffect(() => {
    setAuthToken(token)
    if (token) localStorage.setItem('navshop_token', token)
    else localStorage.removeItem('navshop_token')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('navshop_user', JSON.stringify(user))
    else localStorage.removeItem('navshop_user')
  }, [user])

  async function login(payload) {
    const { data } = await api.post('/auth/login', payload)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  function logout() {
    setToken('')
    setUser(null)
  }

  function saveSession(data) {
    if (data.token) setToken(data.token)
    if (data.user) setUser(data.user)
  }

  const value = useMemo(() => ({ token, user, login, register, logout, saveSession }), [token, user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readStorage('navshop_cart', []))

  useEffect(() => {
    localStorage.setItem('navshop_cart', JSON.stringify(items))
  }, [items])

  function add(product, qty = 1) {
    setItems((current) => {
      const found = current.find((item) => item.id === product.id)
      if (found) {
        return current.map((item) => (item.id === product.id ? { ...item, qty: item.qty + qty } : item))
      }
      return [...current, { ...product, qty }]
    })
  }

  function changeQty(id, qty) {
    const nextQty = Math.max(1, Number(qty || 1))
    setItems((current) => current.map((item) => (item.id === id ? { ...item, qty: nextQty } : item)))
  }

  function remove(id) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  function clear() {
    setItems([])
  }

  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0)
  const count = items.reduce((sum, item) => sum + Number(item.qty), 0)
  const value = useMemo(() => ({ items, count, total, add, changeQty, remove, clear }), [items, count, total])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export function useCart() {
  return useContext(CartContext)
}
