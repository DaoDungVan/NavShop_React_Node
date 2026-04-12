import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { pool } from './db.js'

const jwtSecret = process.env.JWT_SECRET || 'dev_navshop_secret'

function botReply(message) {
  const text = message.toLowerCase()

  if (text.includes('gia') || text.includes('price') || text.includes('bao nhieu')) {
    return 'You can filter by price directly on the NavShop catalog. If you want a quick quote for gaming, office, or design use, I can hand the chat over to an admin.'
  }

  if (text.includes('gaming')) {
    return 'For gaming, NavShop carries 24 to 32 inch monitors in FHD, 2K, and OLED. Send me your budget and I can narrow the options for you.'
  }

  if (text.includes('do hoa') || text.includes('design')) {
    return 'For design or editing work, IPS or OLED panels with at least 2K resolution are a good fit. I can also transfer you to an admin for a more specific recommendation.'
  }

  if (text.includes('van phong') || text.includes('office')) {
    return 'For study or office use, a 24 to 27 inch IPS monitor with FHD or 2K resolution is usually the best balance of comfort and value.'
  }

  if (text.includes('ship') || text.includes('giao')) {
    return 'Delivery time depends on the destination. Send your area or tap Chat with admin so we can check the exact delivery estimate.'
  }

  if (text.includes('bao hanh') || text.includes('warranty')) {
    return 'NavShop sells genuine products with official brand warranty coverage. If you need the policy for a specific monitor model, I can connect you with an admin.'
  }

  if (text.includes('order') || text.includes('don')) {
    return 'If you are signed in, you can review your purchase history in My Orders. If you want help with a specific order, I can pass the chat to an admin.'
  }

  if (text.includes('admin') || text.includes('nhan vien') || text.includes('tu van')) {
    return null
  }

  return 'I am NavBot. I can help with monitor details, pricing, delivery, warranty, and orders. You can also tap Chat with admin in this same chat box.'
}

async function addMessage(conversationId, senderType, senderName, message) {
  const [result] = await pool.query(
    'INSERT INTO chat_messages (conversation_id, sender_type, sender_name, message) VALUES (?, ?, ?, ?)',
    [conversationId, senderType, senderName, message],
  )
  await pool.query('UPDATE chat_conversations SET last_message_at = NOW() WHERE id = ?', [conversationId])
  const [[row]] = await pool.query('SELECT * FROM chat_messages WHERE id = ?', [result.insertId])
  return row
}

async function getOrCreateConversation(visitorToken, visitorName = 'Guest') {
  let token = visitorToken
  if (!token || token.length < 20) token = crypto.randomBytes(32).toString('hex')

  const [[existing]] = await pool.query('SELECT * FROM chat_conversations WHERE visitor_token = ?', [token])
  if (existing) {
    const cleanName = visitorName?.trim()
    if (cleanName && cleanName !== existing.visitor_name) {
      await pool.query('UPDATE chat_conversations SET visitor_name = ? WHERE id = ?', [cleanName, existing.id])
      const [[updated]] = await pool.query('SELECT * FROM chat_conversations WHERE id = ?', [existing.id])
      return { conversation: updated, visitorToken: token }
    }
    return { conversation: existing, visitorToken: token }
  }

  const [result] = await pool.query(
    "INSERT INTO chat_conversations (visitor_token, visitor_name, status) VALUES (?, ?, 'bot')",
    [token, visitorName],
  )

  await addMessage(
    result.insertId,
    'bot',
    'NavBot',
    'Hello, I am NavBot. Do you need monitor advice, a quick quote, delivery support, or an admin?',
  )

  const [[conversation]] = await pool.query('SELECT * FROM chat_conversations WHERE id = ?', [result.insertId])
  return { conversation, visitorToken: token }
}

async function messages(conversationId) {
  const [rows] = await pool.query('SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY id ASC', [conversationId])
  return rows
}

async function conversationList() {
  const [rows] = await pool.query(`
    SELECT c.*,
      (SELECT message FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_message
    FROM chat_conversations c
    ORDER BY FIELD(c.status, 'waiting', 'admin', 'bot', 'closed'), c.last_message_at DESC
    LIMIT 100
  `)
  return rows
}

function getUser(socket) {
  const token = socket.handshake.auth?.token
  if (!token) return null

  try {
    return jwt.verify(token, jwtSecret)
  } catch {
    return null
  }
}

export function registerChat(io) {
  io.on('connection', (socket) => {
    socket.on('visitor:init', async ({ visitorToken, name } = {}, callback) => {
      try {
        const data = await getOrCreateConversation(visitorToken, name || 'Guest')
        socket.join(`chat:${data.conversation.id}`)
        callback?.({ ok: true, ...data, messages: await messages(data.conversation.id) })
      } catch {
        callback?.({ ok: false, message: 'Chat init failed.' })
      }
    })

    socket.on('visitor:message', async ({ conversationId, message }, callback) => {
      try {
        const [[conversation]] = await pool.query('SELECT * FROM chat_conversations WHERE id = ?', [conversationId])
        if (!conversation || !message?.trim()) return callback?.({ ok: false })

        const visitorMessage = await addMessage(conversation.id, 'visitor', conversation.visitor_name || 'Guest', message.trim())
        io.to(`chat:${conversation.id}`).emit('chat:message', visitorMessage)

        if (conversation.status === 'bot') {
          const reply = botReply(message)
          if (reply === null) {
            await pool.query("UPDATE chat_conversations SET status = 'waiting' WHERE id = ?", [conversation.id])
            const systemMessage = await addMessage(conversation.id, 'system', 'System', 'Your conversation has been forwarded to an admin. Please wait here for the reply.')
            io.to(`chat:${conversation.id}`).emit('chat:message', systemMessage)
            io.to('admins').emit('admin:conversations', await conversationList())
          } else {
            const botMessage = await addMessage(conversation.id, 'bot', 'NavBot', reply)
            io.to(`chat:${conversation.id}`).emit('chat:message', botMessage)
          }
        }

        const [[updated]] = await pool.query('SELECT * FROM chat_conversations WHERE id = ?', [conversation.id])
        callback?.({ ok: true, conversation: updated, messages: await messages(conversation.id) })
      } catch {
        callback?.({ ok: false })
      }
    })

    socket.on('visitor:requestAdmin', async ({ conversationId }, callback) => {
      try {
        await pool.query("UPDATE chat_conversations SET status = 'waiting' WHERE id = ?", [conversationId])
        const msg = await addMessage(conversationId, 'system', 'System', 'Your conversation has been forwarded to an admin. Please wait here for the reply.')
        io.to(`chat:${conversationId}`).emit('chat:message', msg)
        io.to('admins').emit('admin:conversations', await conversationList())
        const [[conversation]] = await pool.query('SELECT * FROM chat_conversations WHERE id = ?', [conversationId])
        callback?.({ ok: true, conversation })
      } catch {
        callback?.({ ok: false })
      }
    })

    socket.on('admin:init', async (callback) => {
      const user = getUser(socket)
      if (!user || user.role !== 'admin') return callback?.({ ok: false })
      socket.join('admins')
      callback?.({ ok: true, conversations: await conversationList() })
    })

    socket.on('admin:join', async ({ conversationId }, callback) => {
      const user = getUser(socket)
      if (!user || user.role !== 'admin') return callback?.({ ok: false })
      socket.join(`chat:${conversationId}`)
      await pool.query("UPDATE chat_conversations SET status = 'admin', assigned_admin_id = ? WHERE id = ?", [user.id, conversationId])
      const [[conversation]] = await pool.query('SELECT * FROM chat_conversations WHERE id = ?', [conversationId])
      callback?.({ ok: true, conversation, messages: await messages(conversationId) })
      io.to('admins').emit('admin:conversations', await conversationList())
    })

    socket.on('admin:message', async ({ conversationId, message }, callback) => {
      const user = getUser(socket)
      if (!user || user.role !== 'admin' || !message?.trim()) return callback?.({ ok: false })
      await pool.query("UPDATE chat_conversations SET status = 'admin', assigned_admin_id = ? WHERE id = ?", [user.id, conversationId])
      const msg = await addMessage(conversationId, 'admin', user.name || 'Admin', message.trim())
      io.to(`chat:${conversationId}`).emit('chat:message', msg)
      io.to('admins').emit('admin:conversations', await conversationList())
      callback?.({ ok: true })
    })

    socket.on('admin:close', async ({ conversationId }, callback) => {
      const user = getUser(socket)
      if (!user || user.role !== 'admin') return callback?.({ ok: false })
      await pool.query("UPDATE chat_conversations SET status = 'closed' WHERE id = ?", [conversationId])
      const msg = await addMessage(conversationId, 'system', 'System', 'This conversation has been closed by an admin.')
      io.to(`chat:${conversationId}`).emit('chat:message', msg)
      io.to('admins').emit('admin:conversations', await conversationList())
      callback?.({ ok: true })
    })
  })
}
