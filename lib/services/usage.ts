/**
 * Usage tracking and limit enforcement.
 * Counts messages per workspace per month against free/pro plan limits.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { FREE_TIER_MESSAGE_LIMIT } from '@/lib/config/constants'

export interface UsageStatus {
  allowed: boolean
  usage: number
  limit: number
  plan: string
}

/**
 * Count messages sent this calendar month from slack_conversations.
 */
export async function getMonthlyUsage(workspaceId: string): Promise<number> {
  const supabase = createAdminClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('slack_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('message_role', 'user')
    .gte('created_at', startOfMonth.toISOString())

  if (error) {
    console.error('[ITSquare] getMonthlyUsage error:', error.message)
    return 0
  }

  return count ?? 0
}

/**
 * Check whether a workspace is allowed to send more messages.
 * Returns usage info and whether the message should be allowed.
 */
export async function checkUsageLimits(workspaceId: string): Promise<UsageStatus> {
  const supabase = createAdminClient()

  // Look up the workspace's org subscription tier
  const { data: workspace } = await supabase
    .from('slack_workspaces')
    .select('id, org_id')
    .eq('id', workspaceId)
    .maybeSingle()

  let plan = 'free'
  let limit = FREE_TIER_MESSAGE_LIMIT

  if (workspace?.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', workspace.org_id)
      .maybeSingle()

    console.log(`[ITSquare] checkUsageLimits: org_id=${workspace.org_id} tier=${org?.subscription_tier}`)

    if (org?.subscription_tier && org.subscription_tier !== 'free') {
      plan = org.subscription_tier
      limit = Infinity
    }
  } else {
    console.warn(`[ITSquare] checkUsageLimits: no org_id on workspace ${workspaceId} — treating as free`)
  }

  // Pro (or any paid tier) — always allowed
  if (limit === Infinity) {
    return { allowed: true, usage: 0, limit: Infinity, plan }
  }

  const usage = await getMonthlyUsage(workspaceId)
  const allowed = usage < limit

  return { allowed, usage, limit, plan }
}

/**
 * Record a usage event (non-blocking, best-effort).
 */
export async function trackUsageEvent(
  workspaceId: string,
  slackUserId: string,
  eventType: string,
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('usage_events')
    .insert({
      workspace_id: workspaceId,
      slack_user_id: slackUserId,
      event_type: eventType,
    })

  if (error) {
    console.error('[ITSquare] trackUsageEvent error:', error.message)
  }
}
