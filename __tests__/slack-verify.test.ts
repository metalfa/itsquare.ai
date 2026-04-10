import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'
import { verifySlackSignature } from '@/lib/services/slack-verify'

const SIGNING_SECRET = 'test-signing-secret-12345'

function makeSignature(body: string, timestamp: string, secret: string): string {
  const sigBasestring = `v0:${timestamp}:${body}`
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(sigBasestring)
  return `v0=${hmac.digest('hex')}`
}

describe('verifySlackSignature', () => {
  beforeEach(() => {
    vi.stubEnv('SLACK_SIGNING_SECRET', SIGNING_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('accepts a valid signature', () => {
    const body = '{"type":"url_verification","challenge":"abc"}'
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = makeSignature(body, timestamp, SIGNING_SECRET)

    const result = verifySlackSignature(body, timestamp, signature)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('rejects a tampered body', () => {
    const body = '{"type":"url_verification","challenge":"abc"}'
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = makeSignature(body, timestamp, SIGNING_SECRET)

    const result = verifySlackSignature(body + 'tampered', timestamp, signature)
    expect(result.valid).toBe(false)
  })

  it('rejects a wrong signing secret', () => {
    const body = '{"type":"event_callback"}'
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = makeSignature(body, timestamp, 'wrong-secret')

    const result = verifySlackSignature(body, timestamp, signature)
    expect(result.valid).toBe(false)
  })

  it('rejects a stale timestamp (replay attack)', () => {
    const body = '{"type":"event_callback"}'
    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 600) // 10 min ago
    const signature = makeSignature(body, staleTimestamp, SIGNING_SECRET)

    const result = verifySlackSignature(body, staleTimestamp, signature)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Request timestamp too old')
  })

  it('rejects when SLACK_SIGNING_SECRET is missing', () => {
    vi.stubEnv('SLACK_SIGNING_SECRET', '')

    const result = verifySlackSignature('body', '12345', 'v0=abc')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('SLACK_SIGNING_SECRET not configured')
  })

  it('rejects missing timestamp or signature', () => {
    const result = verifySlackSignature('body', '', '')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Missing timestamp or signature header')
  })
})
