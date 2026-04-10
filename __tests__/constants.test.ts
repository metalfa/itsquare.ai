import { describe, it, expect } from 'vitest'
import {
  MAX_CONTEXT_MESSAGES,
  MAX_OUTPUT_TOKENS,
  AI_MODEL,
  SLACK_SIGNATURE_MAX_AGE_SECONDS,
  FREE_TIER_MESSAGE_LIMIT,
} from '@/lib/config/constants'

describe('constants', () => {
  it('MAX_CONTEXT_MESSAGES is reasonable (5-20)', () => {
    expect(MAX_CONTEXT_MESSAGES).toBeGreaterThanOrEqual(5)
    expect(MAX_CONTEXT_MESSAGES).toBeLessThanOrEqual(20)
  })

  it('MAX_OUTPUT_TOKENS is within API limits', () => {
    expect(MAX_OUTPUT_TOKENS).toBeGreaterThan(100)
    expect(MAX_OUTPUT_TOKENS).toBeLessThanOrEqual(4096)
  })

  it('AI_MODEL is a valid OpenAI model', () => {
    expect(AI_MODEL).toMatch(/^gpt-/)
  })

  it('SLACK_SIGNATURE_MAX_AGE_SECONDS is 5 minutes', () => {
    expect(SLACK_SIGNATURE_MAX_AGE_SECONDS).toBe(300)
  })

  it('FREE_TIER_MESSAGE_LIMIT is set', () => {
    expect(FREE_TIER_MESSAGE_LIMIT).toBeGreaterThan(0)
  })
})
