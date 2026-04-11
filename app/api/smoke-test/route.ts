/**
 * Smoke test for Resolution Engine tables + functions.
 * GET /api/smoke-test
 *
 * Verifies migrations 002+003 are applied correctly.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface Check {
  name: string
  status: 'pass' | 'fail'
  detail: string
}

export async function GET() {
  const checks: Check[] = []
  const supabase = createAdminClient()

  // 1. conversation_threads table
  try {
    const { error } = await supabase
      .from('conversation_threads')
      .select('id')
      .limit(1)
    checks.push({
      name: 'conversation_threads table',
      status: error ? 'fail' : 'pass',
      detail: error ? error.message : 'exists',
    })
  } catch (e: any) {
    checks.push({ name: 'conversation_threads table', status: 'fail', detail: e.message })
  }

  // 2. device_scans table
  try {
    const { error } = await supabase
      .from('device_scans' as any)
      .select('id')
      .limit(1)
    checks.push({
      name: 'device_scans table',
      status: error ? 'fail' : 'pass',
      detail: error ? error.message : 'exists',
    })
  } catch (e: any) {
    checks.push({ name: 'device_scans table', status: 'fail', detail: e.message })
  }

  // 3. execution_requests table
  try {
    const { error } = await supabase
      .from('execution_requests' as any)
      .select('id')
      .limit(1)
    checks.push({
      name: 'execution_requests table',
      status: error ? 'fail' : 'pass',
      detail: error ? error.message : 'exists',
    })
  } catch (e: any) {
    checks.push({ name: 'execution_requests table', status: 'fail', detail: e.message })
  }

  // 4. match_user_history function
  try {
    const { error } = await supabase.rpc('match_user_history', {
      query_embedding: JSON.stringify(new Array(1536).fill(0)),
      match_workspace_id: '00000000-0000-0000-0000-000000000000',
      match_slack_user_id: 'test',
      match_threshold: 0.99,
      match_count: 1,
    })
    checks.push({
      name: 'match_user_history function',
      status: error ? 'fail' : 'pass',
      detail: error ? error.message : 'callable',
    })
  } catch (e: any) {
    checks.push({ name: 'match_user_history function', status: 'fail', detail: e.message })
  }

  // 5. match_colleague_resolutions function
  try {
    const { error } = await supabase.rpc('match_colleague_resolutions', {
      query_embedding: JSON.stringify(new Array(1536).fill(0)),
      match_workspace_id: '00000000-0000-0000-0000-000000000000',
      exclude_slack_user_id: 'test',
      match_threshold: 0.99,
      match_count: 1,
    })
    checks.push({
      name: 'match_colleague_resolutions function',
      status: error ? 'fail' : 'pass',
      detail: error ? error.message : 'callable',
    })
  } catch (e: any) {
    checks.push({ name: 'match_colleague_resolutions function', status: 'fail', detail: e.message })
  }

  // 6. count_recent_similar_issues function
  try {
    const { error } = await supabase.rpc('count_recent_similar_issues', {
      query_embedding: JSON.stringify(new Array(1536).fill(0)),
      match_workspace_id: '00000000-0000-0000-0000-000000000000',
      match_threshold: 0.99,
      hours_back: 48,
    })
    checks.push({
      name: 'count_recent_similar_issues function',
      status: error ? 'fail' : 'pass',
      detail: error ? error.message : 'callable',
    })
  } catch (e: any) {
    checks.push({ name: 'count_recent_similar_issues function', status: 'fail', detail: e.message })
  }

  // 7. increment_thread_message_count function
  try {
    const { error } = await supabase.rpc('increment_thread_message_count', {
      thread_id: '00000000-0000-0000-0000-000000000000',
    })
    // This will "succeed" even with fake ID (just updates 0 rows)
    checks.push({
      name: 'increment_thread_message_count function',
      status: error ? 'fail' : 'pass',
      detail: error ? error.message : 'callable',
    })
  } catch (e: any) {
    checks.push({ name: 'increment_thread_message_count function', status: 'fail', detail: e.message })
  }

  // 8. Check existing knowledge base still works
  try {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('id, title, status')
      .neq('status', 'archived')
      .limit(5)
    checks.push({
      name: 'knowledge_documents',
      status: error ? 'fail' : 'pass',
      detail: error ? error.message : `${data?.length || 0} active documents`,
    })
  } catch (e: any) {
    checks.push({ name: 'knowledge_documents', status: 'fail', detail: e.message })
  }

  // 9. Check active workspace
  try {
    const { data, error } = await supabase
      .from('slack_workspaces')
      .select('id, team_name, team_id')
      .eq('status', 'active')
      .limit(1)
      .single()
    checks.push({
      name: 'active workspace',
      status: error ? 'fail' : 'pass',
      detail: error ? error.message : `${data?.team_name} (${data?.team_id})`,
    })
  } catch (e: any) {
    checks.push({ name: 'active workspace', status: 'fail', detail: e.message })
  }

  const failed = checks.filter((c) => c.status === 'fail')
  return NextResponse.json({
    overall: failed.length === 0
      ? '✅ ALL PASS — Resolution Engine ready'
      : `❌ ${failed.length} check(s) failed`,
    checks,
  })
}
