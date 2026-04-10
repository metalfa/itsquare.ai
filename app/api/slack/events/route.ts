/**
 * Slack Events API handler.
 * Receives @mentions and DMs, generates AI responses, replies in thread.
 *
 * Flow: Slack → verify signature → ack 200 → process async → reply
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptToken } from '@/lib/slack/encryption'
import { verifySlackSignature } from '@/lib/services/slack-verify'
import { postMessage, addReaction, removeReaction } from '@/lib/services/slack-api'
import { getThreadHistory, saveMessage, upsertSlackUser } from '@/lib/services/conversation'
import { generateITResponse } from '@/lib/services/ai'

// Track processed events to prevent duplicate handling on Slack retries
const processedEvents = new Set<string>()

/**
 * POST — Slack Events API endpoint.
 */
export async function POST(request: Request) {
  const rawBody = await request.text()

  // Verify request is from Slack
  const timestamp = request.headers.get('x-slack-request-timestamp') || ''
  const signature = request.headers.get('x-slack-signature') || ''
  const verification = verifySlackSignature(rawBody, timestamp, signature)

  if (!verification.valid) {
    console.error('[ITSquare] Signature verification failed:', verification.error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const body = JSON.parse(rawBody)

  // Handle Slack URL verification challenge
  if (body.type === 'url_verification') {
    return NextResponse.json({ challenge: body.challenge })
  }

  // Handle event callbacks
  if (body.type === 'event_callback') {
    const event = body.event
    const eventId = body.event_id

    // Dedup: Slack retries events if we're slow to ack
    if (eventId && processedEvents.has(eventId)) {
      return NextResponse.json({ ok: true })
    }
    if (eventId) {
      processedEvents.add(eventId)
      // Clean up old entries to prevent memory leak
      if (processedEvents.size > 1000) {
        const entries = [...processedEvents]
        entries.slice(0, 500).forEach((e) => processedEvents.delete(e))
      }
    }

    // Handle app_mention and direct messages
    if (
      event.type === 'app_mention' ||
      (event.type === 'message' && event.channel_type === 'im')
    ) {
      // Skip bot messages and message subtypes (edits, deletes, etc.)
      if (event.bot_id || event.subtype) {
        return NextResponse.json({ ok: true })
      }

      // Process asynchronously — Slack expects a fast ack
      handleMessage(body.team_id, event).catch((err) =>
        console.error('[ITSquare] handleMessage error:', err),
      )
    }
  }

  return NextResponse.json({ ok: true })
}

/**
 * GET — Health check.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/slack/events',
    timestamp: new Date().toISOString(),
  })
}

/**
 * Process a Slack message event asynchronously.
 */
async function handleMessage(teamId: string, event: Record<string, any>) {
  const supabase = createAdminClient()

  // Look up workspace and bot token
  const { data: workspace } = await supabase
    .from('slack_workspaces')
    .select('id, bot_token_encrypted, bot_user_id')
    .eq('team_id', teamId)
    .eq('status', 'active')
    .single()

  if (!workspace) {
    console.error('[ITSquare] No active workspace for team:', teamId)
    return
  }

  const botToken = decryptToken(workspace.bot_token_encrypted)
  const channelId: string = event.channel
  const threadTs: string = event.thread_ts || event.ts
  const userId: string = event.user
  const messageTs: string = event.ts

  // Strip @mention from the message text
  const userMessage = (event.text || '')
    .replace(/<@[A-Z0-9]+>/g, '')
    .trim()

  if (!userMessage) return

  // Show "thinking" indicator
  await addReaction(botToken, channelId, messageTs, 'eyes')

  try {
    // Upsert user record
    const slackUserDbId = await upsertSlackUser(workspace.id, userId)

    // Save user message
    await saveMessage(workspace.id, slackUserDbId, channelId, threadTs, 'user', userMessage, messageTs)

    // Get thread history for context
    const history = await getThreadHistory(channelId, threadTs)

    // Generate AI response (with RAG context from workspace knowledge base)
    const aiResponse = await generateITResponse(userMessage, history, workspace.id)

    // Save AI response
    await saveMessage(workspace.id, slackUserDbId, channelId, threadTs, 'assistant', aiResponse)

    // Post to Slack in thread
    await postMessage(botToken, channelId, aiResponse, threadTs)
  } catch (error) {
    console.error('[ITSquare] Error processing message:', error)
    await postMessage(
      botToken,
      channelId,
      "Sorry, I hit a snag processing that. Could you try again?",
      threadTs,
    )
  } finally {
    // Remove "thinking" indicator
    await removeReaction(botToken, channelId, messageTs, 'eyes')
  }
}
