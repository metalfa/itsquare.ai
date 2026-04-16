import { describe, it, expect } from 'vitest'
import { rateLimit } from '@/lib/services/rate-limit'

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const key = `test-allow-${Date.now()}`
    const r1 = rateLimit(key, 3, 60_000)
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = rateLimit(key, 3, 60_000)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = rateLimit(key, 3, 60_000)
    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('blocks requests over the limit', () => {
    const key = `test-block-${Date.now()}`
    rateLimit(key, 2, 60_000)
    rateLimit(key, 2, 60_000)

    const r3 = rateLimit(key, 2, 60_000)
    expect(r3.allowed).toBe(false)
    expect(r3.remaining).toBe(0)
    expect(r3.resetMs).toBeGreaterThan(0)
  })

  it('allows requests after window expires', async () => {
    const key = `test-expire-${Date.now()}`
    // Use a 10ms window
    rateLimit(key, 1, 10)

    // Wait for the window to expire
    await new Promise((r) => setTimeout(r, 15))

    const r2 = rateLimit(key, 1, 10)
    expect(r2.allowed).toBe(true)
  })

  it('isolates different keys', () => {
    const key1 = `test-iso-a-${Date.now()}`
    const key2 = `test-iso-b-${Date.now()}`

    rateLimit(key1, 1, 60_000)
    const r1 = rateLimit(key1, 1, 60_000)
    expect(r1.allowed).toBe(false)

    const r2 = rateLimit(key2, 1, 60_000)
    expect(r2.allowed).toBe(true)
  })
})
