import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const ENCRYPTION_PREFIX = 'enc:v1'
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getEncryptionKey(): Buffer {
  const secret = process.env.USER_API_KEY_ENCRYPTION_KEY

  if (!secret) {
    throw new Error('USER_API_KEY_ENCRYPTION_KEY is missing')
  }

  // Normalize any key length to 32 bytes for AES-256.
  return createHash('sha256').update(secret).digest()
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(`${ENCRYPTION_PREFIX}:`)
}

export function encryptSecret(value: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [
    ENCRYPTION_PREFIX,
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':')
}

export function decryptSecret(value: string | null | undefined): string | undefined {
  if (!value) return undefined

  // Backward compatibility: plain text values are still readable.
  if (!isEncryptedSecret(value)) return value

  const parts = value.split(':')
  if (parts.length !== 5 || parts[0] !== 'enc' || parts[1] !== 'v1') {
    throw new Error('Invalid encrypted secret format')
  }

  const iv = Buffer.from(parts[2], 'base64url')
  const authTag = Buffer.from(parts[3], 'base64url')
  const encrypted = Buffer.from(parts[4], 'base64url')

  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

