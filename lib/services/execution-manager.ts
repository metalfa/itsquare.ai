/**
 * Execution Manager — creates, tracks, and resolves command execution requests.
 *
 * Lifecycle:
 *   1. AI proposes commands → createRequest() → status: pending
 *   2. User clicks [Run All] → approveRequest() → status: approved
 *   3. CLI agent executes → submitResults() → status: completed
 *   4. Results fed back to AI for interpretation
 *
 * If no CLI agent: commands shown as manual copy-paste instructions.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { ParsedCommand } from './command-safety'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExecutionRequest {
  id: string
  workspaceId: string
  threadId: string | null
  channelId: string
  threadTs: string
  slackUserId: string
  commands: ParsedCommand[]
  purpose: string
  platform: string
  status: string
  results: CommandResult[] | null
  actionMessageTs: string | null
  executionMode: string
  createdAt: string
}

export interface CommandResult {
  command: string
  stdout: string
  stderr: string
  exitCode: number
  tier: number
  executedAt: string
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a new execution request. Called when the AI proposes commands.
 */
export async function createExecutionRequest(
  workspaceId: string,
  channelId: string,
  threadTs: string,
  slackUserId: string,
  commands: ParsedCommand[],
  purpose: string,
  platform: string,
  threadId?: string,
): Promise<string | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('execution_requests' as any)
    .insert({
      workspace_id: workspaceId,
      channel_id: channelId,
      thread_ts: threadTs,
      slack_user_id: slackUserId,
      commands: JSON.stringify(commands),
      purpose,
      platform,
      thread_id: threadId || null,
      status: 'pending',
      execution_mode: 'interactive',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[ITSquare] Failed to create execution request:', error.message)
    return null
  }

  return (data as any)?.id || null
}

/**
 * Store the Slack message timestamp for the action buttons message.
 * Used later to update the message after the user takes action.
 */
export async function setActionMessageTs(
  requestId: string,
  messageTs: string,
): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('execution_requests' as any)
    .update({ action_message_ts: messageTs, updated_at: new Date().toISOString() })
    .eq('id', requestId)
}

// ---------------------------------------------------------------------------
// Approve / Reject
// ---------------------------------------------------------------------------

/**
 * Approve an execution request (user clicked [Run All]).
 */
export async function approveRequest(
  requestId: string,
  approvedBy: string,
  mode: 'interactive' | 'review_each' = 'interactive',
): Promise<ExecutionRequest | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('execution_requests' as any)
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      execution_mode: mode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', 'pending')
    .select('*')
    .single()

  if (error) {
    console.error('[ITSquare] Failed to approve request:', error.message)
    return null
  }

  return data ? mapRequest(data) : null
}

/**
 * Reject/skip an execution request.
 */
export async function rejectRequest(
  requestId: string,
): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('execution_requests' as any)
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

/**
 * Submit execution results from the CLI agent.
 */
export async function submitResults(
  requestId: string,
  results: CommandResult[],
  agentVersion?: string,
): Promise<void> {
  const supabase = createAdminClient()

  const allCompleted = results.every((r) => r.exitCode !== undefined)

  await supabase
    .from('execution_requests' as any)
    .update({
      status: allCompleted ? 'completed' : 'partial',
      results: JSON.stringify(results),
      completed_at: new Date().toISOString(),
      agent_version: agentVersion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
}

/**
 * Get an execution request by ID.
 */
export async function getExecutionRequest(
  requestId: string,
): Promise<ExecutionRequest | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('execution_requests' as any)
    .select('*')
    .eq('id', requestId)
    .single()

  if (error || !data) return null
  return mapRequest(data)
}

/**
 * Get pending results for a user's active conversation.
 * Used by the investigation engine to include recent results in context.
 */
export async function getRecentResults(
  workspaceId: string,
  channelId: string,
  threadTs: string,
): Promise<CommandResult[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('execution_requests' as any)
    .select('results')
    .eq('workspace_id', workspaceId)
    .eq('channel_id', channelId)
    .eq('thread_ts', threadTs)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return []

  const row = data as any
  try {
    return typeof row.results === 'string' ? JSON.parse(row.results) : row.results || []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapRequest(row: any): ExecutionRequest {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    threadId: row.thread_id,
    channelId: row.channel_id,
    threadTs: row.thread_ts,
    slackUserId: row.slack_user_id,
    commands: typeof row.commands === 'string' ? JSON.parse(row.commands) : row.commands,
    purpose: row.purpose,
    platform: row.platform,
    status: row.status,
    results: row.results
      ? typeof row.results === 'string'
        ? JSON.parse(row.results)
        : row.results
      : null,
    actionMessageTs: row.action_message_ts,
    executionMode: row.execution_mode,
    createdAt: row.created_at,
  }
}
