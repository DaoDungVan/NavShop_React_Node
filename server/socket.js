import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { pool } from './db.js'

const jwtSecret = process.env.JWT_SECRET || 'dev_navshop_secret'

function botReply(message) {
  const text = message.toLowerCase()

  if (text.includes('gia') || text.includes('giá') || text.includes('price')) {
    return 'Bạn có thể lọc theo giá ở trang Shop. Nếu cần báo giá chính xác, mình sẽ chuyển admin hỗ trợ.'
  }

  if (text.includes('ship') || text.includes('giao')) {
    return 'Thời gian giao hàng phụ thuộc địa chỉ nhận hàng. Bạn có thể chat với admin để kiểm tra chi tiết.'
  }

  if (text.includes('order') || text.includes('đơn') || text.includes('don')) {
    return 'Nếu đã đăng nhập, bạn xem đơn trong My Orders. Nếu cần kiểm tra đơn cụ thể, hãy chuyển sang admin.'
  }

  if (text.includes('admin') || text.includes('nhân viên') || text.includes('tu van') || text.includes('tư vấn')) {
    return null
  }

  return 'Mình là NavBot. Mình có thể hỗ trợ thông tin màn hình, giá, giao hàng và đơn hàng. Bạn cũng có thể bấm Chat với admin.'
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
    'Xin chào, mình là NavBot. Bạn cần tư vấn màn hình, giá, giao hàng hay muốn gặp admin?',
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
            const systemMessage = await addMessage(conversation.id, 'system', 'System', 'Đã chuyển cuộc chat sang admin. Bạn đợi phản hồi tại đây nhé.')
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
        const msg = await addMessage(conversationId, 'system', 'System', 'Đã chuyển cuộc chat sang admin. Bạn đợi phản hồi tại đây nhé.')
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
      const msg = await addMessage(conversationId, 'system', 'System', 'Admin đã đóng cuộc chat.')
      io.to(`chat:${conversationId}`).emit('chat:message', msg)
      io.to('admins').emit('admin:conversations', await conversationList())
      callback?.({ ok: true })
    })
  })
}
