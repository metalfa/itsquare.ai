/**
 * Agent Poll API
 *
 * GET /api/agent/poll?slack_user_id=U123 — returns pending approved execution requests.
 * The CLI agent polls this endpoint to check for commands to execute.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const slackUserId = request.nextUrl.searchParams.get('slack_user_id')

  if (!slackUserId) {
    return NextResponse.json({ error: 'slack_user_id required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Find approved (not yet executing/completed) requests for this user
  const { data, error } = await supabase
    .from('execution_requests' as any)
    .select('id, commands, purpose, platform, status')
    .eq('slack_user_id', slackUserId)
    .eq('status', 'approved')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(5)

  if (error) {
    console.error('[ITSquare] Poll error:', error.message)
    return NextResponse.json({ requests: [] })
  }

  const requests = (data || []).map((row: any) => ({
    id: row.id,
    commands: typeof row.commands === 'string' ? JSON.parse(row.commands) : row.commands,
    purpose: row.purpose,
    platform: row.platform,
    status: row.status,
  }))

  // Mark requests as executing so they're not picked up again
  for (const req of requests) {
    await supabase
      .from('execution_requests' as any)
      .update({ status: 'executing', updated_at: new Date().toISOString() })
      .eq('id', req.id)
  }

  return NextResponse.json({ requests })
}
