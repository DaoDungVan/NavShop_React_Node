import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'navshop_react',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
}

export async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
  })
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await connection.end()
}

export const pool = mysql.createPool(dbConfig)
