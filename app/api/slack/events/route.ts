/**
 * Slack Events API handler.
 * Receives @mentions and DMs, runs the Resolution Engine, replies in thread.
 *
 * UX Philosophy:
 *   - One message, one response. Never spam.
 *   - Diagnose from what you know. Don't ask users to run terminal commands.
 *   - Show a "working on it" indicator while processing.
 *   - Come back with the answer, not more questions.
 *   - Be a senior IT pro: solve with minimum user involvement.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptToken } from '@/lib/slack/encryption'
import { verifySlackSignature } from '@/lib/services/slack-verify'
import { postMessage, addReaction, removeReaction } from '@/lib/services/slack-api'
import { getThreadHistory, saveMessage, upsertSlackUser } from '@/lib/services/conversation'
import { generateITResponse } from '@/lib/services/ai'
import {
  ensureThread,
  extractAndStoreTopic,
  incrementMessageCount,
  detectResolution,
} from '@/lib/services/thread-manager'

const SLACK_API = 'https://slack.com/api'

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

  // Reject Slack retries — if Slack is retrying, we already got the event
  const retryNum = request.headers.get('x-slack-retry-num')
  if (retryNum) {
    return NextResponse.json({ ok: true })
  }

  // Handle event callbacks
  if (body.type === 'event_callback') {
    const event = body.event

    if (
      event.type === 'app_mention' ||
      (event.type === 'message' && event.channel_type === 'im')
    ) {
      // Skip bot messages and message subtypes
      if (event.bot_id || event.subtype) {
        return NextResponse.json({ ok: true })
      }

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
    version: 'resolution-engine-v3',
    timestamp: new Date().toISOString(),
  })
}

/**
 * Process a Slack message event.
 *
 * Flow:
 *   1. Post "working on it" message immediately
 *   2. Run investigation + generate response
 *   3. Update the "working on it" message with the actual response
 *
 * Result: User sees one loading indicator, then one clean response. No spam.
 */
async function handleMessage(teamId: string, event: Record<string, any>) {
  const supabase = createAdminClient()

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

  const userMessage = (event.text || '')
    .replace(/<@[A-Z0-9]+>/g, '')
    .trim()

  if (!userMessage) return

  // Post a "working on it" message that we'll update later
  const thinkingMsg = await postSlackMessage(botToken, channelId, {
    text: ':mag: _Investigating..._',
    thread_ts: threadTs,
  })
  const thinkingTs = thinkingMsg?.ts

  try {
    // Upsert user record
    const slackUserDbId = await upsertSlackUser(workspace.id, userId)

    // Ensure conversation thread record
    const thread = await ensureThread(workspace.id, channelId, threadTs, userId)

    // Save user message
    await saveMessage(workspace.id, slackUserDbId, channelId, threadTs, 'user', userMessage, messageTs)
    incrementMessageCount(thread.id).catch(() => {})

    // Extract topic on first message
    if (thread.messageCount === 0 && thread.id) {
      extractAndStoreTopic(thread.id, userMessage).catch(() => {})
    }

    // Get thread history
    const history = await getThreadHistory(channelId, threadTs)

    // Generate AI response with full Resolution Engine
    const aiResponse = await generateITResponse(
      userMessage,
      history,
      workspace.id,
      userId,
    )

    // Clean the response — strip any [COMMANDS] blocks since we're not executing them
    const cleanResponse = aiResponse
      .replace(/\[COMMANDS\][\s\S]*?\[\/COMMANDS\]/g, '')
      .replace(/\[DIAGNOSTIC\][\s\S]*?\[\/DIAGNOSTIC\]/g, '')
      .replace(/\[FIX\][\s\S]*?\[\/FIX\]/g, '')
      .trim()

    const finalResponse = cleanResponse || "I need a bit more info to help. Can you describe what's happening in more detail?"

    // Save AI response
    await saveMessage(workspace.id, slackUserDbId, channelId, threadTs, 'assistant', finalResponse)

    // Update the "working on it" message with the actual response
    if (thinkingTs) {
      await updateSlackMessage(botToken, channelId, thinkingTs, finalResponse)
    } else {
      // Fallback: post as new message if update fails
      await postMessage(botToken, channelId, finalResponse, threadTs)
    }

    // Detect resolution signals (async, non-blocking)
    if (history.length >= 2 && thread.id) {
      detectResolution(
        thread.id,
        userMessage,
        finalResponse,
        history.map((m) => ({ role: m.role, content: m.content })),
      ).catch(() => {})
    }
  } catch (error) {
    console.error('[ITSquare] Error processing message:', error)

    const errorMsg = "Sorry, I hit a snag processing that. Could you try again?"
    if (thinkingTs) {
      await updateSlackMessage(botToken, channelId, thinkingTs, errorMsg)
    } else {
      await postMessage(botToken, channelId, errorMsg, threadTs)
    }
  }
}

// ---------------------------------------------------------------------------
// Slack API Helpers
// ---------------------------------------------------------------------------

/**
 * Post a message and return the full response (including ts).
 */
async function postSlackMessage(
  botToken: string,
  channel: string,
  opts: { text: string; thread_ts?: string },
): Promise<{ ts?: string } | null> {
  try {
    const res = await fetch(`${SLACK_API}/chat.postMessage`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        text: opts.text,
        thread_ts: opts.thread_ts,
      }),
    })
    const data = await res.json()
    return data.ok ? { ts: data.ts } : null
  } catch {
    return null
  }
}

/**
 * Update an existing message in-place.
 */
async function updateSlackMessage(
  botToken: string,
  channel: string,
  messageTs: string,
  newText: string,
): Promise<void> {
  try {
    await fetch(`${SLACK_API}/chat.update`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        ts: messageTs,
        text: newText,
      }),
    })
  } catch {
    // Non-critical — message just won't update
  }
}
