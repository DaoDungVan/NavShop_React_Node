import fs from 'fs/promises'
import path from 'path'

const mimeByExtension = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
])

const baseProductFields = [
  'id',
  'name',
  'brand',
  'size',
  'resolution',
  'panel',
  'is_curved',
  'price',
  'image',
  'description',
  'created_at',
  'image_mime',
  '(image_data IS NOT NULL) AS has_image_blob',
]

const baseUserFields = [
  'id',
  'name',
  'email',
  'role',
  'phone',
  'address',
  'gender',
  'avatar',
  'created_at',
  'avatar_mime',
  '(avatar_data IS NOT NULL) AS has_avatar_blob',
]

export const productSelectFields = baseProductFields.join(', ')
export const userSelectFields = baseUserFields.join(', ')
export const userAuthSelectFields = [...baseUserFields, 'password'].join(', ')

function hasBlob(flag) {
  return flag === true || flag === 1 || flag === '1'
}

function detectMimeType(fileName = '') {
  return mimeByExtension.get(path.extname(fileName).toLowerCase()) || null
}

function legacyFilePath(relativePath) {
  if (!relativePath || relativePath.startsWith('http') || !relativePath.startsWith('uploads/')) {
    return null
  }

  return path.join(process.cwd(), 'server', ...relativePath.split('/'))
}

export function uploadedImagePayload(file) {
  if (!file?.buffer?.length) return null

  return {
    data: file.buffer,
    mimeType: file.mimetype || detectMimeType(file.originalname) || 'application/octet-stream',
  }
}

export async function loadLegacyImage(relativePath) {
  const filePath = legacyFilePath(relativePath)
  if (!filePath) return null

  try {
    return {
      data: await fs.readFile(filePath),
      mimeType: detectMimeType(relativePath) || 'application/octet-stream',
    }
  } catch {
    return null
  }
}

export function productImageUrl(product) {
  if (!product) return null
  if (hasBlob(product.has_image_blob)) return `api/products/${product.id}/image`
  return product.image || null
}

export function userAvatarUrl(user) {
  if (!user) return null
  if (hasBlob(user.has_avatar_blob)) return `api/auth/avatar/${user.id}`
  return user.avatar || null
}

export function serializeProduct(product) {
  if (!product) return null

  const { has_image_blob: _hasImageBlob, image_mime: _imageMime, ...safeProduct } = product
  return {
    ...safeProduct,
    image: productImageUrl(product),
  }
}

export function serializeProducts(products) {
  return (products || []).map(serializeProduct)
}

export function serializeUser(user) {
  if (!user) return null

  const {
    password: _password,
    has_avatar_blob: _hasAvatarBlob,
    avatar_mime: _avatarMime,
    avatar_data: _avatarData,
    ...safeUser
  } = user

  return {
    ...safeUser,
    avatar: userAvatarUrl(user),
  }
}
