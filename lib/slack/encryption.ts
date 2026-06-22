import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

function getEncryptionKey(): Buffer {
  const secret = process.env.SLACK_TOKEN_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('SLACK_TOKEN_ENCRYPTION_KEY environment variable is required')
  }
  // Derive a 32-byte key from the secret
  return scryptSync(secret, 'itsquare-slack-salt', 32)
}

/**
 * Encrypts a Slack bot token for secure storage
 */
export function encryptToken(token: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Format: iv:authTag:encryptedData (all in hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts a stored Slack bot token
 */
export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey()
  const [ivHex, authTagHex, encryptedData] = encryptedToken.split(':')
  
  if (!ivHex || !authTagHex || !encryptedData) {
    throw new Error('Invalid encrypted token format')
  }
  
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Generates a secure random token for agent authentication
 * Returns: { token: string (full token for user), prefix: string, hash: string (for storage) }
 */
export async function generateAgentToken(): Promise<{
  token: string
  prefix: string
  hash: string
}> {
  const tokenBytes = randomBytes(32)
  const token = `itsq_${tokenBytes.toString('base64url')}`
  const prefix = token.substring(0, 12)
  
  // Hash the token for storage using Web Crypto API
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return { token, prefix, hash }
}

/**
 * Hashes a token for comparison with stored hash
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
