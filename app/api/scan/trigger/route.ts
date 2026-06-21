// POST /api/scan/trigger - Initiates a new security scan

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runScan } from '@/lib/scan/orchestrator'

export const maxDuration = 300 // 5 minutes max for scan

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.org_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      )
    }

    const orgId = userData.org_id

    // Check for active integrations
    const { data: integrations, error: intError } = await supabase
      .from('integrations')
      .select('id, provider')
      .eq('org_id', orgId)
      .eq('status', 'active')

    if (intError || !integrations?.length) {
      return NextResponse.json(
        { error: 'No active integrations. Please connect Okta or Google Workspace first.' },
        { status: 400 }
      )
    }

    // Check if there's already a scan running
    const { data: runningScan } = await supabase
      .from('scans')
      .select('id')
      .eq('org_id', orgId)
      .eq('status', 'running')
      .single()

    if (runningScan) {
      return NextResponse.json(
        { error: 'A scan is already in progress', scanId: runningScan.id },
        { status: 409 }
      )
    }

    // Create new scan record
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        org_id: orgId,
        status: 'pending',
        triggered_by: user.id,
        trigger_type: 'manual',
      })
      .select('id')
      .single()

    if (scanError || !scan) {
      return NextResponse.json(
        { error: 'Failed to create scan record' },
        { status: 500 }
      )
    }

    // Run the scan (this will take time)
    // In production, this should be delegated to a background job (Trigger.dev)
    const result = await runScan(orgId, scan.id, user.id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        scanId: scan.id,
        scores: result.scores,
        totalUsers: result.totalUsers,
        findingsCount: result.findingsCount,
      })
    } else {
      return NextResponse.json({
        success: false,
        scanId: scan.id,
        error: result.error,
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Scan trigger error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/scan/trigger - Get scan status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const scanId = searchParams.get('scanId')

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (scanId) {
      // Get specific scan status
      const { data: scan, error } = await supabase
        .from('scans')
        .select('*, scan_events(event_type, message, progress_percent, created_at)')
        .eq('id', scanId)
        .single()

      if (error || !scan) {
        return NextResponse.json(
          { error: 'Scan not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ scan })
    } else {
      // Get user's org
      const { data: userData } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single()

      if (!userData?.org_id) {
        return NextResponse.json({ scans: [] })
      }

      // Get recent scans
      const { data: scans, error } = await supabase
        .from('scans')
        .select('*')
        .eq('org_id', userData.org_id)
        .order('created_at', { ascending: false })
        .limit(10)

      return NextResponse.json({ scans: scans || [] })
    }

  } catch (error) {
    console.error('Scan status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
