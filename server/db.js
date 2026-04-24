import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })

function toBoolean(value, fallback = false) {
  if (value == null || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

function buildSslConfig() {
  if (!toBoolean(process.env.DB_SSL, false)) return undefined

  return {
    minVersion: process.env.DB_SSL_MIN_VERSION || 'TLSv1.2',
    rejectUnauthorized: toBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
  }
}

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'navshop_react',
  ssl: buildSslConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
}

export async function ensureDatabase() {
  if (toBoolean(process.env.DB_SKIP_CREATE, false)) return

  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    ssl: dbConfig.ssl,
  })
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await connection.end()
}

export const pool = mysql.createPool(dbConfig)
