import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { formatDate } from '../api'
import { useAuth } from '../state'

const quickReplies = [
  {
    label: 'Loi chao',
    text: 'NavShop xin chao anh chi. Em da nhan duoc tin nhan va se ho tro ngay bay gio.',
  },
  {
    label: 'Tu van gaming',
    text: 'Neu anh chi can man hinh gaming, NavShop dang co cac mau 24 den 32 inch voi FHD, 2K va OLED. Anh chi gui giup em tam gia mong muon de em goi y dung mau.',
  },
  {
    label: 'Tu van van phong',
    text: 'Voi nhu cau hoc tap va van phong, anh chi nen uu tien man hinh IPS 24 den 27 inch, do phan giai FHD hoac 2K de de nhin va toi uu chi phi.',
  },
  {
    label: 'Giao hang',
    text: 'NavShop ho tro giao hang theo dia chi nhan. Anh chi gui giup em khu vuc nhan hang de em kiem tra thoi gian giao va chi phi chinh xac.',
  },
  {
    label: 'Bao hanh',
    text: 'San pham tren NavShop la hang chinh hang va bao hanh theo hang. Anh chi gui em ten san pham hoac link san pham de em kiem tra chinh sach cu the.',
  },
  {
    label: 'Kiem tra don',
    text: 'Anh chi gui giup em ma don hang hoac so dien thoai dat hang, em se kiem tra tinh trang don ngay.',
  },
]

export default function AdminChat() {
  const { token } = useAuth()
  const socket = useMemo(() => io('/', { autoConnect: false, auth: { token } }), [token])
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
        <h1>Live chat ho tro khach hang</h1>
      </div>

      <div className="admin-chat">
        <div className="chat-list">
          <h2>Danh sach hoi thoai</h2>
          {conversations.map((item) => (
            <button className={active?.id === item.id ? 'active' : ''} key={item.id} onClick={() => join(item)}>
              <strong>{item.visitor_name || 'Guest'} <span>{item.status}</span></strong>
              <small>{item.last_message || 'Chua co tin nhan'}</small>
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
                <button onClick={closeChat}>Dong chat</button>
              </div>

              <div className="reply-templates">
                <strong>Van mau tra loi nhanh</strong>
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
                <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Tra loi khach hang..." />
                <button>Gui</button>
              </form>
            </>
          ) : (
            <div className="empty-state">Chon mot cuoc chat de ho tro khach.</div>
          )}
        </div>
      </div>
    </section>
  )
}
