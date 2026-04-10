import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'

function bubbleClass(type) {
  if (type === 'visitor') return 'mine'
  if (type === 'system') return 'system'
  return 'theirs'
}

export default function ChatWidget() {
  const socket = useMemo(() => io('/', { autoConnect: false }), [])
  const [open, setOpen] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [name, setName] = useState(() => localStorage.getItem('navshop_chat_name') || 'Guest')
  const endRef = useRef(null)

  useEffect(() => {
    socket.connect()
    socket.on('chat:message', (message) => {
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]))
    })

    const visitorToken = localStorage.getItem('navshop_visitor_token')
    const visitorName = localStorage.getItem('navshop_chat_name') || 'Guest'
    socket.emit('visitor:init', { visitorToken, name: visitorName }, (response) => {
      if (!response?.ok) return
      localStorage.setItem('navshop_visitor_token', response.visitorToken)
      setConversation(response.conversation)
      setMessages(response.messages || [])
    })

    return () => {
      socket.off('chat:message')
      socket.disconnect()
    }
  }, [socket])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  function sendMessage(event) {
    event.preventDefault()
    if (!text.trim() || !conversation) return
    socket.emit('visitor:message', { conversationId: conversation.id, message: text.trim() }, (response) => {
      if (response?.conversation) setConversation(response.conversation)
    })
    setText('')
  }

  function requestAdmin() {
    if (!conversation) return
    socket.emit('visitor:requestAdmin', { conversationId: conversation.id }, (response) => {
      if (response?.conversation) setConversation(response.conversation)
    })
  }

  function saveName(value) {
    setName(value)
    localStorage.setItem('navshop_chat_name', value)
  }

  function persistName() {
    const visitorToken = localStorage.getItem('navshop_visitor_token')
    socket.emit('visitor:init', { visitorToken, name }, (response) => {
      if (response?.conversation) setConversation(response.conversation)
    })
  }

  return (
    <div className="chat-floating">
      {open && (
        <section className="chat-panel">
          <div className="chat-head">
            <div>
              <strong>NavShop Support</strong>
              <span>{conversation?.status === 'admin' ? 'Admin đang hỗ trợ' : 'NavBot trả lời trước'}</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">×</button>
          </div>

          <div className="chat-name-row">
            <input value={name} onChange={(event) => saveName(event.target.value)} onBlur={persistName} placeholder="Tên của bạn" />
            <button onClick={requestAdmin}>Chat với admin</button>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div className={`chat-message ${bubbleClass(message.sender_type)}`} key={message.id}>
                <small>{message.sender_name}</small>
                <p>{message.message}</p>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form className="chat-form" onSubmit={sendMessage}>
            <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Nhập tin nhắn..." />
            <button>Gửi</button>
          </form>
        </section>
      )}

      <div className="chat-buttons">
        <a className="float-btn zalo-btn" href="https://zalo.me" target="_blank" rel="noreferrer">Zalo</a>
        <button className="float-btn bot-btn" onClick={() => setOpen((value) => !value)}>
          <span>AI</span>
        </button>
      </div>
    </div>
  )
}
