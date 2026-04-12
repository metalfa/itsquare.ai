/**
 * Investigation Engine — the brain of ITSquare.AI
 *
 * Searches 4 sources for every conversation and builds a complete
 * context package for the AI to synthesize into a diagnosis.
 *
 * Sources:
 *   A. User's own history (has THIS person had this before?)
 *   B. Colleague resolutions (has ANYONE in this org solved this?)
 *   C. Knowledge base (documented solutions, runbooks, policies)
 *   D. Device scan context (hardware state for the user's machine)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding } from './embeddings'
import { retrieveContext, type RetrievedContext } from './rag'
import { getHealthTrends, type HealthTrendSummary } from './health-trends'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserHistoryMatch {
  id: string
  topic: string
  resolutionSummary: string | null
  status: string
  confidence: number
  similarity: number
  createdAt: string
  resolvedAt: string | null
}

export interface ColleagueResolution {
  id: string
  topic: string
  resolutionSummary: string
  confidence: number
  timesWorked: number
  timesFailed: number
  similarity: number
  resolvedAt: string
}

export interface DeviceScanData {
  hostname: string | null
  osName: string | null
  osVersion: string | null
  ramTotalGb: number | null
  ramAvailableGb: number | null
  diskTotalGb: number | null
  diskAvailableGb: number | null
  uptimeDays: number | null
  topProcesses: Array<{ name: string; cpu_pct: number; mem_mb: number }> | null
  scannedAt: string
  rawScan: any | null
}

export interface SimilarIssueCount {
  totalCount: number
  uniqueUsers: number
}

export interface InvestigationContext {
  userHistory: UserHistoryMatch[]
  colleagueResolutions: ColleagueResolution[]
  knowledgeBase: RetrievedContext[]
  deviceScan: DeviceScanData | null
  recentSimilarIssues: SimilarIssueCount | null
  healthTrends: HealthTrendSummary | null
}

// ---------------------------------------------------------------------------
// Main Investigation
// ---------------------------------------------------------------------------

/**
 * Run a full 4-source investigation for an incoming user message.
 * All sources are queried in parallel for speed.
 */
export async function investigate(
  workspaceId: string,
  slackUserId: string,
  userMessage: string,
): Promise<InvestigationContext> {
  // Generate embedding once, reuse for all vector searches
  const queryEmbedding = await generateEmbedding(userMessage)
  const supabase = createAdminClient()

  // Run all sources + pattern check + health trends in parallel
  const [userHistory, colleagueResolutions, knowledgeBase, deviceScan, recentSimilar, healthTrends] =
    await Promise.all([
      searchUserHistory(supabase, queryEmbedding, workspaceId, slackUserId),
      searchColleagueResolutions(supabase, queryEmbedding, workspaceId, slackUserId),
      retrieveContext(workspaceId, userMessage),
      getDeviceScan(supabase, workspaceId, slackUserId),
      countRecentSimilarIssues(supabase, queryEmbedding, workspaceId),
      getHealthTrends(workspaceId, slackUserId).catch(() => null),
    ])

  return {
    userHistory,
    colleagueResolutions,
    knowledgeBase,
    deviceScan,
    recentSimilarIssues: recentSimilar,
    healthTrends,
  }
}

// ---------------------------------------------------------------------------
// Source A: User History
// ---------------------------------------------------------------------------

async function searchUserHistory(
  supabase: ReturnType<typeof createAdminClient>,
  queryEmbedding: number[],
  workspaceId: string,
  slackUserId: string,
): Promise<UserHistoryMatch[]> {
  try {
    const { data, error } = await supabase.rpc('match_user_history', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_workspace_id: workspaceId,
      match_slack_user_id: slackUserId,
      match_threshold: 0.55,
      match_count: 3,
    })

    if (error) {
      console.error('[ITSquare] User history search error:', error.message)
      return []
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      topic: row.topic,
      resolutionSummary: row.resolution_summary,
      status: row.status,
      confidence: row.resolution_confidence,
      similarity: row.similarity,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
    }))
  } catch (error) {
    console.error('[ITSquare] User history search failed:', error)
    return []
  }
}

// ---------------------------------------------------------------------------
// Source B: Colleague Resolutions
// ---------------------------------------------------------------------------

async function searchColleagueResolutions(
  supabase: ReturnType<typeof createAdminClient>,
  queryEmbedding: number[],
  workspaceId: string,
  excludeSlackUserId: string,
): Promise<ColleagueResolution[]> {
  try {
    const { data, error } = await supabase.rpc('match_colleague_resolutions', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_workspace_id: workspaceId,
      exclude_slack_user_id: excludeSlackUserId,
      match_threshold: 0.55,
      match_count: 3,
    })

    if (error) {
      console.error('[ITSquare] Colleague resolution search error:', error.message)
      return []
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      topic: row.topic,
      resolutionSummary: row.resolution_summary,
      confidence: row.resolution_confidence,
      timesWorked: row.times_worked,
      timesFailed: row.times_failed,
      similarity: row.similarity,
      resolvedAt: row.resolved_at,
    }))
  } catch (error) {
    console.error('[ITSquare] Colleague resolution search failed:', error)
    return []
  }
}

// ---------------------------------------------------------------------------
// Source D: Device Scan
// ---------------------------------------------------------------------------

async function getDeviceScan(
  supabase: ReturnType<typeof createAdminClient>,
  workspaceId: string,
  slackUserId: string,
): Promise<DeviceScanData | null> {
  try {
    const { data, error } = await supabase
      .from('device_scans' as any)
      .select(
        'hostname, os_name, os_version, ram_total_gb, ram_available_gb, ' +
        'disk_total_gb, disk_available_gb, uptime_days, top_processes, raw_scan, scanned_at',
      )
      .eq('workspace_id', workspaceId)
      .eq('slack_user_id', slackUserId)
      .order('scanned_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null

    const row = data as any

    // Only return scan data if it's less than 7 days old
    const scanAge = Date.now() - new Date(row.scanned_at).getTime()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (scanAge > sevenDays) return null

    // Quality check: shallow browser-only scans lack deep metrics
    // (ram_available_gb, uptime_days, top_processes). Skip them so
    // the AI doesn't get misleading partial data.
    // Enhanced browser scans with cpuScore or speedTestDownloadMbps also qualify.
    const hasDeepData = (
      row.ram_available_gb != null ||
      row.uptime_days != null ||
      (row.top_processes && row.top_processes.length > 0) ||
      (row.raw_scan?.cpuScore != null) ||
      (row.raw_scan?.speedTestDownloadMbps != null)
    )
    if (!hasDeepData) return null

    return {
      hostname: row.hostname,
      osName: row.os_name,
      osVersion: row.os_version,
      ramTotalGb: row.ram_total_gb,
      ramAvailableGb: row.ram_available_gb,
      diskTotalGb: row.disk_total_gb,
      diskAvailableGb: row.disk_available_gb,
      uptimeDays: row.uptime_days,
      topProcesses: row.top_processes,
      scannedAt: row.scanned_at,
      rawScan: row.raw_scan || null,
    }
  } catch (error) {
    console.error('[ITSquare] Device scan lookup failed:', error)
    return null
  }
}

// ---------------------------------------------------------------------------
// Pattern Detection (lightweight, per-conversation)
// ---------------------------------------------------------------------------

async function countRecentSimilarIssues(
  supabase: ReturnType<typeof createAdminClient>,
  queryEmbedding: number[],
  workspaceId: string,
): Promise<SimilarIssueCount | null> {
  try {
    const { data, error } = await supabase.rpc('count_recent_similar_issues', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_workspace_id: workspaceId,
      match_threshold: 0.65,
      hours_back: 48,
    })

    if (error || !data || data.length === 0) return null

    const row = data[0]
    // Only flag if there's a real pattern (3+ reports or 2+ unique users)
    if (row.total_count >= 3 || row.unique_users >= 2) {
      return {
        totalCount: Number(row.total_count),
        uniqueUsers: Number(row.unique_users),
      }
    }

    return null
  } catch (error) {
    console.error('[ITSquare] Similar issue count failed:', error)
    return null
  }
}
