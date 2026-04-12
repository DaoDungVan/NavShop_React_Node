import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const quickStarts = [
  { label: 'Gaming advice', message: 'I need advice for a gaming monitor.' },
  { label: 'Quick quote', message: 'I would like a quick price quote.' },
  { label: 'Delivery', message: 'Can you tell me the delivery time?' },
]

function bubbleClass(type) {
  if (type === 'visitor') return 'mine'
  if (type === 'system') return 'system'
  return 'theirs'
}

export default function ChatWidget() {
  const socket = useMemo(() => io('/', { autoConnect: false, transports: ['websocket'] }), [])
  const [open, setOpen] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [name, setName] = useState(() => localStorage.getItem('navshop_chat_name') || 'Guest')
  const endRef = useRef(null)

  useEffect(() => {
    // Keep the local widget state in sync with the server-side conversation state.
    function syncConversation(visitorName = localStorage.getItem('navshop_chat_name') || 'Guest') {
      const visitorToken = localStorage.getItem('navshop_visitor_token')
      socket.emit('visitor:init', { visitorToken, name: visitorName }, (response) => {
        if (!response?.ok) return
        localStorage.setItem('navshop_visitor_token', response.visitorToken)
        setConversation(response.conversation)
        setMessages(response.messages || [])
      })
    }

    socket.connect()
    socket.on('chat:message', (message) => {
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]))
    })
    syncConversation()
    const intervalId = setInterval(() => syncConversation(), 60_000)

    return () => {
      clearInterval(intervalId)
      socket.off('chat:message')
      socket.disconnect()
    }
  }, [socket])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  function saveName(value) {
    setName(value)
    localStorage.setItem('navshop_chat_name', value)
  }

  function persistName() {
    const visitorToken = localStorage.getItem('navshop_visitor_token')
    socket.emit('visitor:init', { visitorToken, name: name || 'Guest' }, (response) => {
      if (response?.conversation) setConversation(response.conversation)
    })
  }

  function emitMessage(message) {
    if (!message.trim() || !conversation) return
    socket.emit('visitor:message', { conversationId: conversation.id, message: message.trim() }, (response) => {
      if (response?.conversation) setConversation(response.conversation)
    })
  }

  function sendMessage(event) {
    event.preventDefault()
    if (!text.trim()) return
    emitMessage(text)
    setText('')
  }

  function requestAdmin() {
    if (!conversation) return
    socket.emit('visitor:requestAdmin', { conversationId: conversation.id }, (response) => {
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
              <span>{conversation?.status === 'admin' ? 'An admin is helping you' : 'NavBot replies first'}</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">x</button>
          </div>

          <div className="chat-name-row">
            <input value={name} onChange={(event) => saveName(event.target.value)} onBlur={persistName} placeholder="Your name" />
            <button onClick={requestAdmin}>Chat with admin</button>
          </div>

          <div className="chat-shortcuts">
            {quickStarts.map((item) => (
              <button key={item.label} type="button" onClick={() => emitMessage(item.message)}>
                {item.label}
              </button>
            ))}
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
            <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Type your message..." />
            <button>Send</button>
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
