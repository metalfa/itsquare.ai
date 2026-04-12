/**
 * Tests for health-trends.ts — trend prompt formatting.
 */

import { describe, it, expect } from 'vitest'
import { buildTrendPrompt, type HealthTrendSummary } from '@/lib/services/health-trends'

describe('buildTrendPrompt', () => {
  it('returns null when no trends exist', () => {
    const summary: HealthTrendSummary = {
      trends: [],
      snapshotCount: 0,
      oldestSnapshotDaysAgo: null,
    }
    expect(buildTrendPrompt(summary)).toBeNull()
  })

  it('returns null when only 1 snapshot exists', () => {
    const summary: HealthTrendSummary = {
      trends: [
        { metric: 'download_speed', currentValue: 10, previousValue: 5, changePct: 100, direction: 'improved' },
      ],
      snapshotCount: 1,
      oldestSnapshotDaysAgo: 0,
    }
    expect(buildTrendPrompt(summary)).toBeNull()
  })

  it('formats improved trends with up arrow', () => {
    const summary: HealthTrendSummary = {
      trends: [
        { metric: 'download_speed', currentValue: 20, previousValue: 10, changePct: 100, direction: 'improved' },
      ],
      snapshotCount: 5,
      oldestSnapshotDaysAgo: 14,
    }
    const result = buildTrendPrompt(summary)!
    expect(result).toContain('📈')
    expect(result).toContain('Download speed')
    expect(result).toContain('10 → 20')
    expect(result).toContain('+100%')
    expect(result).toContain('improved')
    expect(result).toContain('5')  // snapshot count
    expect(result).toContain('14 days')
  })

  it('formats degraded trends with down arrow', () => {
    const summary: HealthTrendSummary = {
      trends: [
        { metric: 'latency', currentValue: 300, previousValue: 100, changePct: 200, direction: 'degraded' },
      ],
      snapshotCount: 3,
      oldestSnapshotDaysAgo: 7,
    }
    const result = buildTrendPrompt(summary)!
    expect(result).toContain('📉')
    expect(result).toContain('Network latency')
    expect(result).toContain('degraded')
  })

  it('formats stable trends with arrow', () => {
    const summary: HealthTrendSummary = {
      trends: [
        { metric: 'cpu_score', currentValue: 95, previousValue: 93, changePct: 2.2, direction: 'stable' },
      ],
      snapshotCount: 10,
      oldestSnapshotDaysAgo: 30,
    }
    const result = buildTrendPrompt(summary)!
    expect(result).toContain('➡️')
    expect(result).toContain('CPU performance')
    expect(result).toContain('stable')
    expect(result).toContain('95')
  })

  it('handles multiple trends', () => {
    const summary: HealthTrendSummary = {
      trends: [
        { metric: 'download_speed', currentValue: 20, previousValue: 10, changePct: 100, direction: 'improved' },
        { metric: 'cpu_score', currentValue: 80, previousValue: 90, changePct: -11.1, direction: 'degraded' },
        { metric: 'latency', currentValue: 50, previousValue: 55, changePct: -9.1, direction: 'stable' },
      ],
      snapshotCount: 8,
      oldestSnapshotDaysAgo: 21,
    }
    const result = buildTrendPrompt(summary)!
    expect(result).toContain('📈')
    expect(result).toContain('📉')
    expect(result).toContain('➡️')
    expect(result).toContain('8')
  })
})
