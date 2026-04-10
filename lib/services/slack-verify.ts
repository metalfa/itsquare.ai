/**
 * Slack request signature verification.
 * Used by both Events API and slash command handlers.
 *
 * @see https://api.slack.com/authentication/verifying-requests-from-slack
 */

import crypto from 'crypto'
import { SLACK_SIGNATURE_MAX_AGE_SECONDS } from '@/lib/config/constants'

export interface VerificationResult {
  valid: boolean
  error?: string
}

/**
 * Verifies that a request actually came from Slack using HMAC-SHA256.
 */
export function verifySlackSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
): VerificationResult {
  const signingSecret = process.env.SLACK_SIGNING_SECRET

  if (!signingSecret) {
    return { valid: false, error: 'SLACK_SIGNING_SECRET not configured' }
  }

  if (!timestamp || !signature) {
    return { valid: false, error: 'Missing timestamp or signature header' }
  }

  // Protect against replay attacks
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp, 10)) > SLACK_SIGNATURE_MAX_AGE_SECONDS) {
    return { valid: false, error: 'Request timestamp too old' }
  }

  const sigBasestring = `v0:${timestamp}:${rawBody}`
  const hmac = crypto.createHmac('sha256', signingSecret)
  hmac.update(sigBasestring)
  const computed = `v0=${hmac.digest('hex')}`

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature),
    )
    return { valid: isValid }
  } catch {
    return { valid: false, error: 'Signature length mismatch' }
  }
}
