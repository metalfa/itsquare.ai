import { describe, it, expect } from 'vitest'
import { buildInvestigationPrompt } from '../lib/services/context-builder'
import type { InvestigationContext } from '../lib/services/investigation'

function emptyCtx(): InvestigationContext {
  return {
    userHistory: [],
    colleagueResolutions: [],
    knowledgeBase: [],
    deviceScan: null,
    recentSimilarIssues: null,
  }
}

describe('buildInvestigationPrompt', () => {
  it('returns empty string when no context is available', () => {
    const result = buildInvestigationPrompt(emptyCtx())
    expect(result).toBe('')
  })

  it('includes device scan data with low RAM warning', () => {
    const ctx = emptyCtx()
    ctx.deviceScan = {
      hostname: 'sarahs-macbook',
      osName: 'macOS',
      osVersion: '14.3',
      ramTotalGb: 8,
      ramAvailableGb: 1.2,
      diskTotalGb: 256,
      diskAvailableGb: 45,
      uptimeDays: 3,
      topProcesses: [
        { name: 'Outlook', cpu_pct: 12, mem_mb: 1800 },
        { name: 'Chrome', cpu_pct: 8, mem_mb: 1200 },
      ],
      scannedAt: new Date().toISOString(),
    }

    const result = buildInvestigationPrompt(ctx)
    expect(result).toContain('Device Scan Data')
    expect(result).toContain('sarahs-macbook')
    expect(result).toContain('macOS 14.3')
    expect(result).toContain('LOW RAM')
    expect(result).toContain('Outlook')
    expect(result).not.toContain('LOW DISK')
    expect(result).not.toContain('HIGH UPTIME')
  })

  it('includes user history with resolved issues', () => {
    const ctx = emptyCtx()
    ctx.userHistory = [
      {
        id: '1',
        topic: 'Outlook crashes on macOS',
        resolutionSummary: 'Cleared OST file and restarted Outlook',
        status: 'resolved',
        confidence: 0.85,
        similarity: 0.78,
        createdAt: '2026-03-12T10:00:00Z',
        resolvedAt: '2026-03-12T10:30:00Z',
      },
    ]

    const result = buildInvestigationPrompt(ctx)
    expect(result).toContain("This User's Previous Issues")
    expect(result).toContain('Outlook crashes')
    expect(result).toContain('Cleared OST file')
    expect(result).toContain('85%')
  })

  it('includes colleague resolutions with declining confidence warning', () => {
    const ctx = emptyCtx()
    ctx.colleagueResolutions = [
      {
        id: '2',
        topic: 'Outlook crashes after update',
        resolutionSummary: 'Updated Outlook to 16.84',
        confidence: 0.4,
        timesWorked: 3,
        timesFailed: 4,
        similarity: 0.72,
        resolvedAt: '2026-03-20T15:00:00Z',
      },
    ]

    const result = buildInvestigationPrompt(ctx)
    expect(result).toContain('Colleague Resolutions')
    expect(result).toContain('Updated Outlook to 16.84')
    expect(result).toContain('declining in effectiveness')
    expect(result).toContain('worked 3/7 times')
  })

  it('includes knowledge base entries', () => {
    const ctx = emptyCtx()
    ctx.knowledgeBase = [
      { content: 'WiFi password is SuperSecret123', documentId: 'doc1', similarity: 0.9 },
    ]

    const result = buildInvestigationPrompt(ctx)
    expect(result).toContain('Knowledge Base')
    expect(result).toContain('WiFi password is SuperSecret123')
  })

  it('includes pattern alert when similar issues detected', () => {
    const ctx = emptyCtx()
    ctx.recentSimilarIssues = { totalCount: 5, uniqueUsers: 4 }

    const result = buildInvestigationPrompt(ctx)
    expect(result).toContain('PATTERN ALERT')
    expect(result).toContain('5 similar issues')
    expect(result).toContain('4 different users')
  })

  it('combines all sources into one prompt', () => {
    const ctx: InvestigationContext = {
      userHistory: [
        {
          id: '1',
          topic: 'VPN disconnects',
          resolutionSummary: 'Reinstalled VPN client',
          status: 'resolved',
          confidence: 0.9,
          similarity: 0.8,
          createdAt: '2026-03-01T10:00:00Z',
          resolvedAt: '2026-03-01T10:30:00Z',
        },
      ],
      colleagueResolutions: [
        {
          id: '2',
          topic: 'VPN timeout issues',
          resolutionSummary: 'Updated network driver',
          confidence: 0.7,
          timesWorked: 5,
          timesFailed: 1,
          similarity: 0.75,
          resolvedAt: '2026-03-15T12:00:00Z',
        },
      ],
      knowledgeBase: [
        { content: 'VPN requires version 4.2+', documentId: 'doc1', similarity: 0.85 },
      ],
      deviceScan: {
        hostname: 'dev-laptop',
        osName: 'Windows',
        osVersion: '11',
        ramTotalGb: 16,
        ramAvailableGb: 8,
        diskTotalGb: 512,
        diskAvailableGb: 200,
        uptimeDays: 20,
        topProcesses: null,
        scannedAt: new Date().toISOString(),
      },
      recentSimilarIssues: null,
    }

    const result = buildInvestigationPrompt(ctx)
    expect(result).toContain('Device Scan Data')
    expect(result).toContain("This User's Previous Issues")
    expect(result).toContain('Colleague Resolutions')
    expect(result).toContain('Knowledge Base')
    expect(result).toContain('HIGH UPTIME')
    expect(result).toContain('INVESTIGATION CONTEXT')
  })
})
