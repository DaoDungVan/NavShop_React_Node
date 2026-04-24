import bcrypt from 'bcryptjs'
import { dbConfig, ensureDatabase, pool } from './db.js'
import { loadLegacyImage } from './media.js'
import { seedProducts } from './seed.js'

async function columnExists(tableName, columnName) {
  const [[row]] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `,
    [dbConfig.database, tableName, columnName],
  )

  return Number(row.total) > 0
}

async function ensureColumn(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) return
  await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`)
}

async function migrateLegacyProductImages() {
  const [products] = await pool.query('SELECT id, image FROM products WHERE image_data IS NULL AND image IS NOT NULL')

  for (const product of products) {
    const legacyImage = await loadLegacyImage(product.image)
    if (!legacyImage) continue

    await pool.query(
      'UPDATE products SET image_mime = ?, image_data = ? WHERE id = ?',
      [legacyImage.mimeType, legacyImage.data, product.id],
    )
  }
}

async function migrateLegacyAvatars() {
  const [users] = await pool.query('SELECT id, avatar FROM users WHERE avatar_data IS NULL AND avatar IS NOT NULL')

  for (const user of users) {
    const legacyAvatar = await loadLegacyImage(user.avatar)
    if (!legacyAvatar) continue

    await pool.query(
      'UPDATE users SET avatar_mime = ?, avatar_data = ? WHERE id = ?',
      [legacyAvatar.mimeType, legacyAvatar.data, user.id],
    )
  }
}

export async function initDb() {
  await ensureDatabase()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin','user') DEFAULT 'user',
      phone VARCHAR(20) NULL,
      address VARCHAR(255) NULL,
      gender ENUM('male','female','other') NULL,
      avatar VARCHAR(255) NULL,
      avatar_mime VARCHAR(100) NULL,
      avatar_data MEDIUMBLOB NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      brand VARCHAR(50) NOT NULL,
      size INT NOT NULL,
      resolution VARCHAR(20) NOT NULL,
      panel VARCHAR(20) NOT NULL,
      is_curved TINYINT(1) DEFAULT 0,
      price INT NOT NULL,
      image VARCHAR(255) NULL,
      image_mime VARCHAR(100) NULL,
      image_data MEDIUMBLOB NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      customer_name VARCHAR(120) NULL,
      customer_phone VARCHAR(30) NULL,
      customer_address VARCHAR(255) NULL,
      total_price INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      product_name VARCHAR(150) NOT NULL,
      price INT NOT NULL,
      qty INT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      visitor_token VARCHAR(80) NOT NULL UNIQUE,
      visitor_name VARCHAR(120) NULL,
      status ENUM('bot','waiting','admin','closed') NOT NULL DEFAULT 'bot',
      assigned_admin_id INT NULL,
      last_message_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_chat_status_updated (status, updated_at)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      sender_type ENUM('visitor','bot','admin','system') NOT NULL,
      sender_name VARCHAR(120) NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
      INDEX idx_chat_messages_conversation (conversation_id, id)
    )
  `)

  await ensureColumn('users', 'avatar_mime', 'VARCHAR(100) NULL')
  await ensureColumn('users', 'avatar_data', 'MEDIUMBLOB NULL')
  await ensureColumn('products', 'image_mime', 'VARCHAR(100) NULL')
  await ensureColumn('products', 'image_data', 'MEDIUMBLOB NULL')

  const [[adminCount]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'")
  if (adminCount.total === 0) {
    const password = await bcrypt.hash('admin123', 10)
    await pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
      'Admin',
      'admin@gmail.com',
      password,
      'admin',
    ])
  }

  const [[productCount]] = await pool.query('SELECT COUNT(*) AS total FROM products')
  if (productCount.total === 0) {
    await pool.query(
      'INSERT INTO products (name, brand, size, resolution, panel, is_curved, price, image, description) VALUES ?',
      [seedProducts],
    )
  }

  await migrateLegacyProductImages()
  await migrateLegacyAvatars()
}
