/**
 * Conversation manager.
 * Handles thread history storage and retrieval from Supabase.
 * Uses the `slack_conversations` table (one row per message).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { MAX_CONTEXT_MESSAGES } from '@/lib/config/constants'

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Get thread history for AI context.
 * Returns the last N messages in chronological order.
 */
export async function getThreadHistory(
  channelId: string,
  threadTs: string,
): Promise<ConversationMessage[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('slack_conversations')
    .select('message_role, message_content')
    .eq('channel_id', channelId)
    .eq('thread_ts', threadTs)
    .order('created_at', { ascending: true })
    .limit(MAX_CONTEXT_MESSAGES)

  if (error) {
    console.error('[ITSquare] Failed to load thread history:', error.message)
    return []
  }

  return (data || []).map((m) => ({
    role: m.message_role as 'user' | 'assistant',
    content: m.message_content,
  }))
}

/**
 * Save a single message to the conversation table.
 */
export async function saveMessage(
  workspaceId: string,
  slackUserId: string,
  channelId: string,
  threadTs: string,
  role: 'user' | 'assistant',
  content: string,
  messageTs?: string,
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('slack_conversations').insert({
    workspace_id: workspaceId,
    slack_user_id: slackUserId,
    channel_id: channelId,
    thread_ts: threadTs,
    message_role: role,
    message_content: content,
    message_ts: messageTs,
  })

  if (error) {
    console.error('[ITSquare] Failed to save message:', error.message)
  }
}

/**
 * Get or create a Slack user record, and update last_interaction_at.
 * Returns the database ID for the slack_users row.
 */
export async function upsertSlackUser(
  workspaceId: string,
  slackUserId: string,
): Promise<string> {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('slack_users')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('slack_user_id', slackUserId)
    .single()

  if (existing) {
    await supabase
      .from('slack_users')
      .update({ last_interaction_at: new Date().toISOString() })
      .eq('id', existing.id)
    return existing.id
  }

  const { data: newUser } = await supabase
    .from('slack_users')
    .insert({ workspace_id: workspaceId, slack_user_id: slackUserId })
    .select('id')
    .single()

  return newUser?.id || slackUserId
}
