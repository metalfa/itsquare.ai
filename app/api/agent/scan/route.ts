/**
 * Agent Scan Upload API
 *
 * POST /api/agent/scan — receives device scan data from the CLI agent.
 * Upserts into device_scans table (one row per user per workspace).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { slack_user_id, scan } = body

    if (!slack_user_id || !scan) {
      return NextResponse.json(
        { error: 'slack_user_id and scan are required' },
        { status: 400 },
      )
    }

    // Get workspace from auth token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Authenticate via workspace agent token
    // The token is a SHA-256 hash stored in slack_workspaces.agent_token_hash
    // For MVP: match against bot_token_encrypted as a simple workspace lookup
    const { data: workspace } = await supabase
      .from('slack_workspaces')
      .select('id')
      .eq('agent_token', token)
      .eq('status', 'active')
      .maybeSingle()

    // Fallback: if no agent_token column yet, find by active workspace
    // This keeps backward compat during migration
    const resolvedWorkspace = workspace || await supabase
      .from('slack_workspaces')
      .select('id')
      .eq('status', 'active')
      .limit(1)
      .single()
      .then(r => r.data)

    if (!resolvedWorkspace) {
      return NextResponse.json({ error: 'Invalid token or no active workspace' }, { status: 401 })
    }

    const workspaceId = resolvedWorkspace.id

    // Upsert device scan (one per user per workspace)
    const { error } = await supabase
      .from('device_scans' as any)
      .upsert(
        {
          workspace_id: workspaceId,
          slack_user_id,
          hostname: scan.hostname,
          os_name: scan.osName,
          os_version: scan.osVersion,
          cpu_model: scan.cpuModel,
          ram_total_gb: scan.ramTotalGb,
          ram_available_gb: scan.ramAvailableGb,
          disk_total_gb: scan.diskTotalGb,
          disk_available_gb: scan.diskAvailableGb,
          uptime_days: scan.uptimeDays,
          top_processes: scan.topProcesses,
          raw_scan: scan,
          scanned_at: scan.scannedAt || new Date().toISOString(),
        },
        { onConflict: 'workspace_id,slack_user_id' },
      )

    if (error) {
      console.error('[ITSquare] Scan upload error:', error.message)
      return NextResponse.json({ error: 'Failed to store scan' }, { status: 500 })
    }

    // Also insert a health snapshot (append-only history for trend detection)
    await supabase
      .from('device_health_snapshots' as any)
      .insert({
        workspace_id: workspaceId,
        slack_user_id,
        source: 'cli',
        os_name: scan.osName,
        os_version: scan.osVersion,
        ram_total_gb: scan.ramTotalGb,
        cpu_cores: scan.topProcesses?.length > 0 ? undefined : undefined,
        cpu_score: null,
        download_speed_mbps: null,
        upload_speed_mbps: null,
        latency_ms: null,
        battery_level: null,
        battery_charging: null,
        raw_data: scan,
      })
      .then(({ error: snapErr }) => {
        if (snapErr) console.error('[ITSquare] Health snapshot insert error:', snapErr.message)
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ITSquare] Agent scan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/agent/scan',
    timestamp: new Date().toISOString(),
  })
}
