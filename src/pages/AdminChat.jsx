import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { formatDate } from '../api'
import { useAuth } from '../state'

const quickReplies = [
  {
    label: 'Greeting',
    text: 'Hello from NavShop. I have received your message and I am ready to help right away.',
  },
  {
    label: 'Gaming advice',
    text: 'If you need a gaming monitor, NavShop currently offers 24 to 32 inch models in FHD, 2K, and OLED. Please share your budget so I can recommend the right options.',
  },
  {
    label: 'Office advice',
    text: 'For study or office work, I recommend a 24 to 27 inch IPS monitor with FHD or 2K resolution for a comfortable view and good value.',
  },
  {
    label: 'Delivery',
    text: 'NavShop supports delivery based on your destination. Please share your area so I can check the delivery time and shipping cost for you.',
  },
  {
    label: 'Warranty',
    text: 'Products at NavShop are genuine and follow the official brand warranty policy. Send me the product name or link and I will check the exact policy for you.',
  },
  {
    label: 'Order lookup',
    text: 'Please send your order number or the phone number used for checkout and I will check the order status for you.',
  },
]

export default function AdminChat() {
  const { token } = useAuth()
  const socket = useMemo(() => io('/', { autoConnect: false, transports: ['websocket'], auth: { token } }), [token])
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
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
  }, [socket])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    setActive((current) => current ? { ...current, status: 'closed' } : current)
  }

  return (
    <section className="admin-chat-page">
      <div className="section-title">
        <span>Admin</span>
        <h1>Customer live chat</h1>
      </div>

      <div className="admin-chat">
        <div className="chat-list">
          <h2>Conversation queue</h2>
          {conversations.map((item) => (
            <button className={active?.id === item.id ? 'active' : ''} key={item.id} onClick={() => join(item)}>
              <strong>{item.visitor_name || 'Guest'} <span>{item.status}</span></strong>
              <small>{item.last_message || 'No messages yet'}</small>
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
                <button onClick={closeChat}>Close chat</button>
              </div>

              <div className="reply-templates">
                <strong>Quick reply templates</strong>
                <div className="reply-template-list">
                  {quickReplies.map((item) => (
                    <button key={item.label} type="button" onClick={() => setText(item.text)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="chat-messages admin-mode">
                {messages.map((message) => (
                  <div className={`chat-message ${message.sender_type === 'admin' ? 'mine' : message.sender_type === 'system' ? 'system' : 'theirs'}`} key={message.id}>
                    <small>{message.sender_name}</small>
                    <p>{message.message}</p>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <form className="chat-form" onSubmit={send}>
                <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Reply to customer..." />
                <button>Send</button>
              </form>
            </>
          ) : (
            <div className="empty-state">Choose a conversation to support the customer.</div>
          )}
        </div>
      </div>
    </section>
  )
}
