import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { formatDate } from '../api'
import { useAuth } from '../state'

export default function AdminChat() {
  const { user, token } = useAuth()
  const socket = useMemo(() => io('/', { autoConnect: false, auth: { token } }), [token])
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    if (user?.role !== 'admin') return undefined
    socket.connect()
    socket.emit('admin:init', (response) => {
      if (response?.ok) setConversations(response.conversations || [])
    })
    socket.on('admin:conversations', setConversations)
    socket.on('chat:message', (message) => {
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]))
    })
    return () => {
      socket.off('admin:conversations')
      socket.off('chat:message')
      socket.disconnect()
    }
  }, [socket, token, user])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  function join(conversation) {
    socket.emit('admin:join', { conversationId: conversation.id }, (response) => {
      if (!response?.ok) return
      setActive(response.conversation)
      setMessages(response.messages || [])
    })
  }

  function send(event) {
    event.preventDefault()
    if (!active || !text.trim()) return
    socket.emit('admin:message', { conversationId: active.id, message: text.trim() })
    setText('')
  }

  function closeChat() {
    if (!active) return
    socket.emit('admin:close', { conversationId: active.id })
  }

  return (
    <section className="page-shell admin-layout">
      <aside className="admin-sidebar">
        <Link to="/admin/products">Products</Link>
        <Link to="/admin/orders">Orders</Link>
        <Link to="/admin/chat">Live Chat</Link>
      </aside>

      <div className="admin-chat">
        <div className="chat-list">
          <h2>Live chat</h2>
          {conversations.map((item) => (
            <button className={active?.id === item.id ? 'active' : ''} key={item.id} onClick={() => join(item)}>
              <strong>{item.visitor_name || 'Guest'} <span>{item.status}</span></strong>
              <small>{item.last_message || 'Chưa có tin nhắn'}</small>
              <em>{formatDate(item.last_message_at)}</em>
            </button>
          ))}
        </div>

        <div className="admin-chat-window">
          {active ? (
            <>
              <div className="admin-chat-head">
                <div>
                  <strong>{active.visitor_name || 'Guest'}</strong>
                  <span>Conversation #{active.id}</span>
                </div>
                <button onClick={closeChat}>Đóng chat</button>
              </div>
              <div className="chat-messages admin-mode">
                {messages.map((message) => (
                  <div className={`chat-message ${message.sender_type === 'admin' ? 'mine' : 'theirs'}`} key={message.id}>
                    <small>{message.sender_name}</small>
                    <p>{message.message}</p>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form className="chat-form" onSubmit={send}>
                <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Trả lời khách..." />
                <button>Gửi</button>
              </form>
            </>
          ) : (
            <div className="empty-state">Chọn một cuộc chat để hỗ trợ khách.</div>
          )}
        </div>
      </div>
    </section>
  )
}
