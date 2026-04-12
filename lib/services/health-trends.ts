/**
 * Health Trends — compares current scan with historical data.
 *
 * Queries device_health_snapshots to detect changes over time.
 * Returns human-readable trend descriptions for the AI context.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export interface HealthTrend {
  metric: string
  currentValue: number
  previousValue: number
  changePct: number
  direction: 'improved' | 'degraded' | 'stable'
}

export interface HealthTrendSummary {
  trends: HealthTrend[]
  snapshotCount: number
  oldestSnapshotDaysAgo: number | null
}

/**
 * Get health trends for a user by comparing latest scan vs historical.
 */
export async function getHealthTrends(
  workspaceId: string,
  slackUserId: string,
): Promise<HealthTrendSummary> {
  const supabase = createAdminClient()

  // Get trend data from RPC
  const [trendResult, countResult] = await Promise.all([
    supabase.rpc('get_health_trend', {
      match_workspace_id: workspaceId,
      match_slack_user_id: slackUserId,
      days_back: 7,
    }),
    supabase
      .from('device_health_snapshots' as any)
      .select('created_at')
      .eq('workspace_id', workspaceId)
      .eq('slack_user_id', slackUserId)
      .order('created_at', { ascending: true })
      .limit(1),
  ])

  const trends: HealthTrend[] = (trendResult.data || []).map((row: any) => ({
    metric: row.metric,
    currentValue: row.current_value,
    previousValue: row.previous_value,
    changePct: Math.round(row.change_pct * 10) / 10,
    direction: row.direction,
  }))

  // Count total snapshots
  const { count } = await supabase
    .from('device_health_snapshots' as any)
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('slack_user_id', slackUserId)

  let oldestDaysAgo: number | null = null
  if (countResult.data && countResult.data.length > 0) {
    const oldest = new Date((countResult.data[0] as any).created_at)
    oldestDaysAgo = Math.round((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24))
  }

  return {
    trends,
    snapshotCount: count || 0,
    oldestSnapshotDaysAgo: oldestDaysAgo,
  }
}

/**
 * Build a human-readable trend summary for AI context injection.
 */
export function buildTrendPrompt(summary: HealthTrendSummary): string | null {
  if (summary.trends.length === 0 || summary.snapshotCount < 2) return null

  const lines: string[] = ['## Health Trends (compared to ~7 days ago)']
  
  for (const trend of summary.trends) {
    const metricLabel = {
      download_speed: 'Download speed',
      cpu_score: 'CPU performance',
      latency: 'Network latency',
    }[trend.metric] || trend.metric

    const arrow = trend.direction === 'improved' ? '📈' : 
                  trend.direction === 'degraded' ? '📉' : '➡️'

    if (trend.direction === 'stable') {
      lines.push(`${arrow} ${metricLabel}: stable (${trend.currentValue})`)
    } else {
      lines.push(`${arrow} ${metricLabel}: ${trend.previousValue} → ${trend.currentValue} (${trend.changePct > 0 ? '+' : ''}${trend.changePct}% — ${trend.direction})`)
    }
  }

  lines.push(`\nTotal scans on record: ${summary.snapshotCount} (tracking for ${summary.oldestSnapshotDaysAgo} days)`)

  return lines.join('\n')
}
