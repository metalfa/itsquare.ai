import { describe, it, expect } from 'vitest'
import { buildContextPrompt } from '@/lib/services/rag'
import type { RetrievedContext } from '@/lib/services/rag'

describe('buildContextPrompt', () => {
  it('returns empty string when no contexts', () => {
    expect(buildContextPrompt([])).toBe('')
  })

  it('builds formatted context block for single result', () => {
    const contexts: RetrievedContext[] = [
      {
        content: 'To connect to VPN, install GlobalProtect from the IT portal.',
        documentId: 'doc-1',
        similarity: 0.92,
      },
    ]

    const result = buildContextPrompt(contexts)

    expect(result).toContain('COMPANY KNOWLEDGE BASE')
    expect(result).toContain('GlobalProtect')
    expect(result).toContain('[1]')
    expect(result).not.toContain('[2]')
  })

  it('builds numbered context for multiple results', () => {
    const contexts: RetrievedContext[] = [
      { content: 'WiFi password is on the breakroom whiteboard.', documentId: 'doc-1', similarity: 0.95 },
      { content: 'For guest WiFi, use network "Guest-IT" with no password.', documentId: 'doc-2', similarity: 0.88 },
      { content: 'IT support hours are 8am-6pm CT.', documentId: 'doc-3', similarity: 0.75 },
    ]

    const result = buildContextPrompt(contexts)

    expect(result).toContain('[1]')
    expect(result).toContain('[2]')
    expect(result).toContain('[3]')
    expect(result).toContain('WiFi password')
    expect(result).toContain('Guest-IT')
    expect(result).toContain('8am-6pm')
  })

  it('includes instructions for natural integration', () => {
    const contexts: RetrievedContext[] = [
      { content: 'Some content', documentId: 'doc-1', similarity: 0.9 },
    ]

    const result = buildContextPrompt(contexts)

    // Should tell AI to use KB naturally without mentioning it
    expect(result).toContain("Don't mention")
    expect(result).toContain('answer naturally')
  })
})
