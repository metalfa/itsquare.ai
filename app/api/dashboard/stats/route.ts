/**
 * Dashboard Stats API
 *
 * GET /api/dashboard/stats — returns real-time workspace health metrics.
 * Used by the dashboard to render fleet health, conversation stats, and trends.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const requestedWsId = url.searchParams.get('workspace_id')

    const userSupabase = await createClient()
    const { data: { user } } = await userSupabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org
    const { data: profile } = await userSupabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization' }, { status: 404 })
    }

    const admin = createAdminClient()

    // Fetch ALL active workspaces for this org
    const { data: allWorkspaces } = await admin
      .from('slack_workspaces')
      .select('id, team_name')
      .eq('org_id', profile.org_id)
      .eq('status', 'active')
      .order('installed_at', { ascending: true })

    if (!allWorkspaces || allWorkspaces.length === 0) {
      return NextResponse.json({ error: 'No workspace' }, { status: 404 })
    }

    // If a specific workspace was requested, validate it belongs to this org
    let workspace = allWorkspaces[0]
    if (requestedWsId) {
      const found = allWorkspaces.find((w: any) => w.id === requestedWsId)
      if (found) {
        workspace = found
      }
      // If not found, fall back to first workspace (don't leak data)
    }

    const wsId = workspace.id

    // Run all queries in parallel
    const [
      conversationStats,
      resolutionStats,
      deviceStats,
      recentThreads,
      topIssues,
      kbStats,
    ] = await Promise.all([
      getConversationStats(admin, wsId),
      getResolutionStats(admin, wsId),
      getDeviceStats(admin, wsId),
      getRecentThreads(admin, wsId),
      getTopIssues(admin, wsId),
      getKBStats(admin, wsId),
    ])

    return NextResponse.json({
      workspace: { id: wsId, name: workspace.team_name },
      allWorkspaces: allWorkspaces.map((w: any) => ({ id: w.id, name: w.team_name })),
      conversations: conversationStats,
      resolutions: resolutionStats,
      devices: deviceStats,
      recentThreads,
      topIssues,
      knowledgeBase: kbStats,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[ITSquare] Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

async function getConversationStats(supabase: any, wsId: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [totalRes, todayRes, weekRes, monthRes, openRes] = await Promise.all([
    supabase.from('conversation_threads').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId),
    supabase.from('conversation_threads').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId).gte('created_at', today),
    supabase.from('conversation_threads').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId).gte('created_at', weekAgo),
    supabase.from('conversation_threads').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId).gte('created_at', monthAgo),
    supabase.from('conversation_threads').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId).eq('status', 'open'),
  ])

  return {
    total: totalRes.count || 0,
    today: todayRes.count || 0,
    thisWeek: weekRes.count || 0,
    thisMonth: monthRes.count || 0,
    open: openRes.count || 0,
  }
}

async function getResolutionStats(supabase: any, wsId: string) {
  const [resolvedRes, escalatedRes, avgConfRes] = await Promise.all([
    supabase.from('conversation_threads').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId).eq('status', 'resolved'),
    supabase.from('conversation_threads').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId).eq('status', 'escalated'),
    supabase.from('conversation_threads').select('resolution_confidence').eq('workspace_id', wsId).eq('status', 'resolved').not('resolution_confidence', 'is', null),
  ])

  const resolved = resolvedRes.count || 0
  const escalated = escalatedRes.count || 0
  const confidenceData = avgConfRes.data || []
  const avgConfidence = confidenceData.length > 0
    ? confidenceData.reduce((sum: number, r: any) => sum + (r.resolution_confidence || 0), 0) / confidenceData.length
    : 0

  return {
    resolved,
    escalated,
    avgConfidence: Math.round(avgConfidence * 100),
    autoResolveRate: resolved + escalated > 0 ? Math.round((resolved / (resolved + escalated)) * 100) : 0,
  }
}

async function getDeviceStats(supabase: any, wsId: string) {
  const { data: devices } = await supabase
    .from('device_health_snapshots')
    .select('slack_user_id, os_name, cpu_score, download_speed_mbps, latency_ms, created_at')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (!devices || devices.length === 0) {
    return { totalDevices: 0, platforms: {}, healthAlerts: [] }
  }

  // Unique devices (by user)
  const uniqueUsers = new Set(devices.map((d: any) => d.slack_user_id))

  // Platform breakdown (latest scan per user)
  const seenUsers = new Set()
  const platforms: Record<string, number> = {}
  const healthAlerts: Array<{ user: string; metric: string; value: number; severity: string }> = []

  for (const d of devices) {
    if (seenUsers.has(d.slack_user_id)) continue
    seenUsers.add(d.slack_user_id)

    const os = d.os_name || 'Unknown'
    platforms[os] = (platforms[os] || 0) + 1

    // Flag health issues
    if (d.cpu_score != null && d.cpu_score < 40) {
      healthAlerts.push({ user: d.slack_user_id, metric: 'CPU', value: d.cpu_score, severity: 'critical' })
    }
    if (d.download_speed_mbps != null && d.download_speed_mbps < 5) {
      healthAlerts.push({ user: d.slack_user_id, metric: 'Network', value: d.download_speed_mbps, severity: 'critical' })
    }
    if (d.latency_ms != null && d.latency_ms > 300) {
      healthAlerts.push({ user: d.slack_user_id, metric: 'Latency', value: d.latency_ms, severity: 'warning' })
    }
  }

  return {
    totalDevices: uniqueUsers.size,
    platforms,
    healthAlerts: healthAlerts.slice(0, 5),
  }
}

async function getRecentThreads(supabase: any, wsId: string) {
  const { data } = await supabase
    .from('conversation_threads')
    .select('id, topic, status, slack_user_id, resolution_confidence, created_at, resolved_at')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: false })
    .limit(10)

  return (data || []).map((t: any) => ({
    id: t.id,
    topic: t.topic || 'Untitled conversation',
    status: t.status,
    user: t.slack_user_id,
    confidence: t.resolution_confidence,
    createdAt: t.created_at,
    resolvedAt: t.resolved_at,
  }))
}

async function getTopIssues(supabase: any, wsId: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('conversation_threads')
    .select('topic')
    .eq('workspace_id', wsId)
    .gte('created_at', weekAgo)
    .not('topic', 'is', null)

  if (!data || data.length === 0) return []

  // Simple frequency count by topic keywords
  const topicCounts: Record<string, number> = {}
  for (const t of data) {
    const normalized = (t.topic as string).toLowerCase().trim()
    topicCounts[normalized] = (topicCounts[normalized] || 0) + 1
  }

  return Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }))
}

async function getKBStats(supabase: any, wsId: string) {
  const [docsRes, autoRes, chunksRes] = await Promise.all([
    supabase.from('knowledge_documents').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId).eq('status', 'active'),
    supabase.from('knowledge_documents').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId).eq('source_type', 'auto_extracted'),
    supabase.from('knowledge_chunks').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId),
  ])

  return {
    totalDocs: docsRes.count || 0,
    autoExtracted: autoRes.count || 0,
    totalChunks: chunksRes.count || 0,
  }
}
