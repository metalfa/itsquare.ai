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

    // For now, look up workspace by token (simple auth)
    // TODO: implement proper agent token auth
    const { data: workspace } = await supabase
      .from('slack_workspaces')
      .select('id')
      .eq('status', 'active')
      .limit(1)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'No active workspace' }, { status: 404 })
    }

    // Upsert device scan (one per user per workspace)
    const { error } = await supabase
      .from('device_scans' as any)
      .upsert(
        {
          workspace_id: workspace.id,
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
