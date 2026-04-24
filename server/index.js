import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { initDb } from './initDb.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import { registerChat } from './socket.js'

dotenv.config({ quiet: true })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const port = Number(process.env.PORT || 4000)
const dbConnectRetries = Number(process.env.DB_CONNECT_RETRIES || 60)
const dbConnectRetryMs = Number(process.env.DB_CONNECT_RETRY_MS || 5000)

function parseAllowedOrigins(...values) {
  return [...new Set(
    values
      .flatMap((value) => String(value || '').split(','))
      .map((value) => value.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  )]
}

const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_URL, process.env.RENDER_EXTERNAL_URL)

function corsOrigin(origin, callback) {
  const normalizedOrigin = origin?.replace(/\/+$/, '')

  if (!normalizedOrigin || allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
    callback(null, true)
    return
  }

  callback(new Error(`Origin ${origin} is not allowed by CORS`))
}

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: { origin: corsOrigin, credentials: true },
})

app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get(/.*/, (_req, res) => res.sendFile(path.join(distPath, 'index.html')))
}

registerChat(io)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function start() {
  let lastError

  for (let attempt = 1; attempt <= dbConnectRetries; attempt += 1) {
    try {
      await initDb()
      server.listen(port, () => {
        console.log(`NavShop API running on http://localhost:${port}`)
      })
      return
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      console.error(`Database init attempt ${attempt}/${dbConnectRetries} failed: ${message}`)

      if (attempt < dbConnectRetries) {
        await sleep(dbConnectRetryMs)
      }
    }
  }

  console.error('Failed to start server:', lastError)
  process.exit(1)
}

start()
