/**
 * Slack Events API handler.
 * Receives @mentions and DMs, runs the Resolution Engine, replies in thread.
 *
 * Flow:
 *   Slack → verify signature → ack 200 → process async:
 *     1. Ensure conversation thread record exists
 *     2. Extract topic + embedding (first message only)
 *     3. Run 4-source investigation
 *     4. Generate AI response with full context
 *     5. Detect resolution signals
 *     6. Reply in Slack thread
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptToken } from '@/lib/slack/encryption'
import { verifySlackSignature } from '@/lib/services/slack-verify'
import { postMessage, addReaction, removeReaction } from '@/lib/services/slack-api'

const SLACK_API = 'https://slack.com/api'
import { getThreadHistory, saveMessage, upsertSlackUser } from '@/lib/services/conversation'
import { generateITResponse } from '@/lib/services/ai'
import {
  ensureThread,
  extractAndStoreTopic,
  incrementMessageCount,
  detectResolution,
} from '@/lib/services/thread-manager'
import { parseCommandResponse, detectPlatform } from '@/lib/services/command-parser'
import { createExecutionRequest, setActionMessageTs, getRecentResults } from '@/lib/services/execution-manager'
import { buildCommandProposalBlocks, buildManualExecutionBlocks } from '@/lib/services/slack-blocks'
import { investigate } from '@/lib/services/investigation'

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
    version: 'resolution-engine-v1',
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
  await addReaction(botToken, channelId, messageTs, 'mag')

  try {
    // Upsert user record
    const slackUserDbId = await upsertSlackUser(workspace.id, userId)

    // Ensure conversation thread record exists
    const thread = await ensureThread(workspace.id, channelId, threadTs, userId)

    // Save user message + increment thread counter
    await saveMessage(workspace.id, slackUserDbId, channelId, threadTs, 'user', userMessage, messageTs)
    incrementMessageCount(thread.id).catch(() => {})

    // Extract topic on first message in thread (async, non-blocking)
    if (thread.messageCount === 0 && thread.id) {
      extractAndStoreTopic(thread.id, userMessage).catch((err) =>
        console.error('[ITSquare] Topic extraction error:', err),
      )
    }

    // Get thread history for multi-turn context
    const history = await getThreadHistory(channelId, threadTs)

    // Check for pending execution results in this thread
    const recentResults = await getRecentResults(workspace.id, channelId, threadTs)
    let contextMessage = userMessage
    if (recentResults.length > 0) {
      const resultsBlock = recentResults
        .map((r) => `\`${r.command}\` → ${r.exitCode === 0 ? 'OK' : 'ERROR'}: ${(r.stdout || r.stderr || '').substring(0, 500)}`)
        .join('\n')
      contextMessage = `${userMessage}\n\n[Recent command results for context:\n${resultsBlock}]`
    }

    // Generate AI response with full Resolution Engine context
    const aiResponse = await generateITResponse(
      contextMessage,
      history,
      workspace.id,
      userId, // enables 4-source investigation
    )

    // Parse AI response for command proposals
    const deviceScan = thread.id ? await getDeviceScanPlatform(workspace.id, userId) : null
    const platform = detectPlatform(deviceScan)
    const parsed = parseCommandResponse(aiResponse, platform)

    // Save the clean text (without [COMMANDS] block) as the AI response
    await saveMessage(workspace.id, slackUserDbId, channelId, threadTs, 'assistant', parsed.cleanText)

    // Post the conversational part
    if (parsed.cleanText) {
      await postMessage(botToken, channelId, parsed.cleanText, threadTs)
    }

    // If the AI proposed commands, post an interactive message
    if (parsed.commands && parsed.commands.length > 0) {
      const execRequestId = await createExecutionRequest(
        workspace.id,
        channelId,
        threadTs,
        userId,
        parsed.commands,
        'Diagnostic commands proposed by ITSquare',
        platform,
        thread.id || undefined,
      )

      if (execRequestId) {
        // Post Block Kit interactive message with buttons
        const blocks = buildCommandProposalBlocks(
          execRequestId,
          'I\'d like to run some diagnostics on your machine:',
          parsed.commands,
        )
        const actionMsg = await postBlockMessage(botToken, channelId, blocks, threadTs)
        if (actionMsg?.ts) {
          setActionMessageTs(execRequestId, actionMsg.ts).catch(() => {})
        }
      } else {
        // Fallback: post commands as manual instructions
        const manualBlocks = buildManualExecutionBlocks(parsed.commands)
        await postBlockMessage(botToken, channelId, manualBlocks, threadTs)
      }
    }

    // Detect resolution signals (async, non-blocking)
    // Only check after at least 2 exchanges (user asked, bot replied, user responded)
    if (history.length >= 2 && thread.id) {
      detectResolution(
        thread.id,
        userMessage,
        aiResponse,
        history.map((m) => ({ role: m.role, content: m.content })),
      ).catch((err) =>
        console.error('[ITSquare] Resolution detection error:', err),
      )
    }
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
    await removeReaction(botToken, channelId, messageTs, 'mag')
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get OS name from device scan for platform detection.
 */
async function getDeviceScanPlatform(
  workspaceId: string,
  slackUserId: string,
): Promise<string | null> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('device_scans' as any)
    .select('os_name')
    .eq('workspace_id', workspaceId)
    .eq('slack_user_id', slackUserId)
    .order('scanned_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as any)?.os_name || null
}

/**
 * Post a Block Kit message to Slack. Returns the message response.
 */
async function postBlockMessage(
  botToken: string,
  channel: string,
  blocks: any[],
  threadTs?: string,
): Promise<{ ts?: string } | null> {
  const body: any = {
    channel,
    blocks,
    text: 'ITSquare command execution request',
  }
  if (threadTs) body.thread_ts = threadTs

  try {
    const res = await fetch(`${SLACK_API}/chat.postMessage`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return data.ok ? { ts: data.ts } : null
  } catch {
    return null
  }
}
