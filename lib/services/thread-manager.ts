/**
 * Thread Manager — tracks conversation lifecycle.
 *
 * Creates/updates conversation_threads records and handles:
 * - Thread creation on first message
 * - Topic extraction + embedding (AI-generated summary)
 * - Resolution detection ("that worked!" / "still broken")
 * - Solution extraction when resolved
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding } from './embeddings'
import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { AI_MODEL } from '@/lib/config/constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationThread {
  id: string
  workspaceId: string
  channelId: string
  threadTs: string
  slackUserId: string
  topic: string | null
  status: 'open' | 'resolved' | 'escalated' | 'stale'
  resolutionSummary: string | null
  resolutionConfidence: number
  messageCount: number
}

// ---------------------------------------------------------------------------
// Thread Lifecycle
// ---------------------------------------------------------------------------

/**
 * Ensure a conversation thread record exists. Creates one on first message.
 * Returns the thread record.
 */
export async function ensureThread(
  workspaceId: string,
  channelId: string,
  threadTs: string,
  slackUserId: string,
): Promise<ConversationThread> {
  const supabase = createAdminClient()

  // Try to get existing thread
  const { data: existing } = await supabase
    .from('conversation_threads')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('channel_id', channelId)
    .eq('thread_ts', threadTs)
    .maybeSingle()

  if (existing) {
    return mapThread(existing)
  }

  // Create new thread
  const { data: created, error } = await supabase
    .from('conversation_threads')
    .insert({
      workspace_id: workspaceId,
      channel_id: channelId,
      thread_ts: threadTs,
      slack_user_id: slackUserId,
      status: 'open',
      message_count: 0,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[ITSquare] Failed to create thread:', error.message)
    // Return a minimal object so processing can continue
    return {
      id: '',
      workspaceId,
      channelId,
      threadTs,
      slackUserId,
      topic: null,
      status: 'open',
      resolutionSummary: null,
      resolutionConfidence: 1.0,
      messageCount: 0,
    }
  }

  return mapThread(created)
}

/**
 * Increment message count on a thread.
 */
export async function incrementMessageCount(threadId: string): Promise<void> {
  if (!threadId) return
  const supabase = createAdminClient()

  const { error } = await supabase.rpc('increment_thread_message_count', {
    thread_id: threadId,
  })

  if (error) {
    console.error('[ITSquare] Failed to increment message count:', error.message)
  }
}

/**
 * Extract the issue topic from the first user message and store embedding.
 * Called after the first message in a new thread.
 */
export async function extractAndStoreTopic(
  threadId: string,
  userMessage: string,
): Promise<void> {
  if (!threadId) return
  const supabase = createAdminClient()

  try {
    // Use AI to extract a concise topic
    const { text: topic } = await generateText({
      model: gateway(AI_MODEL),
      messages: [
        {
          role: 'system',
          content:
            'Extract a brief IT issue topic (max 15 words) from this message. ' +
            'Output ONLY the topic, nothing else. Examples: ' +
            '"Outlook crashes on macOS", "VPN not connecting from home", ' +
            '"Slow laptop with high RAM usage"',
        },
        { role: 'user', content: userMessage },
      ],
      maxOutputTokens: 50,
    })

    const cleanTopic = topic.trim().replace(/^["']|["']$/g, '')

    // Generate embedding for the topic
    const topicEmbedding = await generateEmbedding(userMessage) // Embed the full message, not just topic

    await supabase
      .from('conversation_threads')
      .update({
        topic: cleanTopic,
        topic_embedding: JSON.stringify(topicEmbedding),
        updated_at: new Date().toISOString(),
      })
      .eq('id', threadId)
  } catch (error) {
    console.error('[ITSquare] Topic extraction failed:', error)
  }
}

/**
 * Analyze a conversation exchange for resolution signals.
 * Returns the detected status and optional resolution summary.
 *
 * Called after each bot response, analyzes the latest user message
 * in context of the conversation.
 */
export async function detectResolution(
  threadId: string,
  userMessage: string,
  botResponse: string,
  conversationHistory: Array<{ role: string; content: string }>,
): Promise<{ resolved: boolean; escalated: boolean; summary: string | null }> {
  if (!threadId) return { resolved: false, escalated: false, summary: null }

  try {
    const recentExchanges = conversationHistory.slice(-6)
    const conversationText = recentExchanges
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')

    const { text: analysis } = await generateText({
      model: gateway(AI_MODEL),
      messages: [
        {
          role: 'system',
          content: `Analyze this IT support conversation and determine its status.
Reply with EXACTLY one JSON object (no other text):
{
  "status": "open" | "resolved" | "escalated",
  "resolution_summary": "<1-2 sentence summary of what fixed it, or null if not resolved>"
}

Rules:
- "resolved" = user explicitly or implicitly confirmed the issue is fixed ("thanks!", "that worked", "all good now", etc.)
- "escalated" = bot offered to escalate AND user accepted, or user explicitly asked for human help
- "open" = conversation is still active, no clear resolution yet
- Be conservative: if unsure, say "open"
- resolution_summary should describe the FIX, not the problem`,
        },
        {
          role: 'user',
          content: `Latest user message: ${userMessage}\n\nBot response: ${botResponse}\n\nFull conversation:\n${conversationText}`,
        },
      ],
      maxOutputTokens: 200,
    })

    const parsed = JSON.parse(analysis.trim())
    const resolved = parsed.status === 'resolved'
    const escalated = parsed.status === 'escalated'

    if (resolved || escalated) {
      await updateThreadResolution(
        threadId,
        parsed.status,
        parsed.resolution_summary || null,
      )
    }

    return {
      resolved,
      escalated,
      summary: parsed.resolution_summary || null,
    }
  } catch (error) {
    // Don't let resolution detection failures break the bot
    console.error('[ITSquare] Resolution detection error:', error)
    return { resolved: false, escalated: false, summary: null }
  }
}

/**
 * Update thread status and store resolution embedding for future searches.
 */
async function updateThreadResolution(
  threadId: string,
  status: string,
  resolutionSummary: string | null,
): Promise<void> {
  const supabase = createAdminClient()

  const update: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'resolved') {
    update.resolved_at = new Date().toISOString()
  }

  if (resolutionSummary) {
    update.resolution_summary = resolutionSummary

    try {
      const embedding = await generateEmbedding(resolutionSummary)
      update.resolution_embedding = JSON.stringify(embedding)
    } catch {
      // Non-critical: resolution will just be less searchable
    }
  }

  await supabase
    .from('conversation_threads')
    .update(update)
    .eq('id', threadId)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapThread(row: any): ConversationThread {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    channelId: row.channel_id,
    threadTs: row.thread_ts,
    slackUserId: row.slack_user_id,
    topic: row.topic,
    status: row.status,
    resolutionSummary: row.resolution_summary,
    resolutionConfidence: row.resolution_confidence,
    messageCount: row.message_count,
  }
}
