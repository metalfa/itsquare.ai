import { describe, it, expect } from 'vitest'
import { SYSTEM_PROMPT, HELP_MESSAGE, FALLBACK_MESSAGE } from '@/lib/config/prompts'

describe('prompts', () => {
  it('SYSTEM_PROMPT contains essential instructions', () => {
    expect(SYSTEM_PROMPT).toContain('ITSquare')
    expect(SYSTEM_PROMPT).toContain('NEVER')
    expect(SYSTEM_PROMPT).toContain('Slack')
    expect(SYSTEM_PROMPT).toContain('escalation')
    expect(SYSTEM_PROMPT).toContain('diagnostic')
  })

  it('HELP_MESSAGE contains slash command examples', () => {
    expect(HELP_MESSAGE).toContain('/itsquare')
    expect(HELP_MESSAGE).toContain('wifi')
    expect(HELP_MESSAGE).toContain('VPN')
  })

  it('FALLBACK_MESSAGE provides helpful guidance', () => {
    expect(FALLBACK_MESSAGE).toContain('restart')
    expect(FALLBACK_MESSAGE.length).toBeGreaterThan(50)
  })
})
