/**
 * Slack Events API handler.
 * Receives @mentions and DMs, runs the Resolution Engine, replies in thread.
 *
 * Uses Next.js after() to keep execution alive on Vercel serverless
 * after the 200 ack is sent to Slack.
 */

import { NextResponse, after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptToken } from '@/lib/slack/encryption'
import { verifySlackSignature } from '@/lib/services/slack-verify'
import { postMessage } from '@/lib/services/slack-api'
import { getThreadHistory, saveMessage, upsertSlackUser } from '@/lib/services/conversation'
import { generateITResponse } from '@/lib/services/ai'
import {
  ensureThread,
  extractAndStoreTopic,
  incrementMessageCount,
  detectResolution,
} from '@/lib/services/thread-manager'
import { chooseDiagnosticSet, getDiagnosticCommands } from '@/lib/services/auto-diagnostic'
import { createExecutionRequest } from '@/lib/services/execution-manager'

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

  // Reject Slack retries
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
      if (event.bot_id || event.subtype) {
        return NextResponse.json({ ok: true })
      }

      const teamId = body.team_id
      const eventTs = event.ts as string

      // Use after() so Vercel keeps execution alive after the 200 ack
      after(async () => {
        try {
          await handleMessage(teamId, event, eventTs)
        } catch (err) {
          console.error('[ITSquare] handleMessage error:', err)
        }
      })
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
    version: 'resolution-engine-v4',
    timestamp: new Date().toISOString(),
  })
}

/**
 * Process a Slack message event.
 *
 * Dedup: Uses the message timestamp (event.ts) to check if we already
 * processed this exact message. Prevents double-processing when Slack
 * sends the same event through multiple delivery paths.
 */
async function handleMessage(teamId: string, event: Record<string, any>, eventTs: string) {
  const supabase = createAdminClient()

  // Dedup: check if we already saved this exact message (by message_ts)
  const channelId: string = event.channel
  const { data: existing } = await supabase
    .from('slack_conversations')
    .select('id')
    .eq('channel_id', channelId)
    .eq('message_ts', eventTs)
    .limit(1)
    .maybeSingle()

  if (existing) {
    console.log(`[ITSquare] Skipping duplicate event: ${eventTs}`)
    return
  }

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
  const threadTs: string = event.thread_ts || event.ts
  const userId: string = event.user
  const messageTs: string = event.ts

  const userMessage = (event.text || '')
    .replace(/<@[A-Z0-9]+>/g, '')
    .trim()

  if (!userMessage) return

  // Post "Investigating..." — will update in-place with the answer
  const thinkingMsg = await postSlackMessage(botToken, channelId, {
    text: ':hourglass_flowing_sand: _Working on it..._',
    thread_ts: threadTs,
  })
  const thinkingTs = thinkingMsg?.ts

  try {
    // Upsert user record
    const slackUserDbId = await upsertSlackUser(workspace.id, userId)

    // Ensure conversation thread record
    const thread = await ensureThread(workspace.id, channelId, threadTs, userId)

    // Save user message (also serves as dedup marker via message_ts)
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

    // Clean any structured blocks from the response
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
      await postMessage(botToken, channelId, finalResponse, threadTs)
    }

    // Check if user wants deeper diagnostics (CLI-based)
    if (wantsDiagnostics(userMessage)) {
      // Figure out what kind of diagnostics to run
      const conversationSummary = history
        .slice(-6)
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n')
      const diagSet = await chooseDiagnosticSet(conversationSummary + '\n' + userMessage)

      // Detect platform from device scan (default macOS)
      const platform = await getDevicePlatform(workspace.id, userId)

      // Get the commands for this diagnostic set
      const commands = getDiagnosticCommands(diagSet, platform)
      const diagName = diagSet === 'network' ? 'network' : diagSet === 'security' ? 'security' : 'system performance'

      // Create execution request (status: pending until user approves)
      const parsedCommands = commands.map((cmd) => ({
        command: cmd,
        tier: 1 as const,
        explanation: '',
        platform: platform as any,
      }))

      const execRequestId = await createExecutionRequest(
        workspace.id,
        channelId,
        threadTs,
        userId,
        parsedCommands,
        `${diagName} diagnostics`,
        platform,
        thread.id || undefined,
      )

      if (execRequestId) {
        // Post consent prompt with buttons
        await postBlockMessage(botToken, channelId, [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🔍 I can run a quick *${diagName} check* on your machine. This will look at ${
                diagSet === 'network' ? 'connectivity, DNS, and latency'
                : diagSet === 'security' ? 'firewall, encryption, and updates'
                : 'CPU, RAM, disk space, and running processes'
              }. *Nothing will be changed or modified.*`,
            },
          },
          {
            type: 'actions',
            block_id: `diag_consent_${execRequestId}`,
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: '✅ Go ahead', emoji: true },
                style: 'primary',
                action_id: 'diag_consent_yes',
                value: execRequestId,
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: '❌ No thanks', emoji: true },
                action_id: 'diag_consent_no',
                value: execRequestId,
              },
            ],
          },
        ], threadTs)
      }
    }

    // Detect resolution (async, non-blocking)
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
    const errorMsg = "Sorry, I hit a snag. Could you try again?"
    if (thinkingTs) {
      await updateSlackMessage(botToken, channelId, thinkingTs, errorMsg)
    } else {
      await postMessage(botToken, channelId, errorMsg, threadTs)
    }
  }
}

// ---------------------------------------------------------------------------
// Slack Helpers
// ---------------------------------------------------------------------------

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
 * Detect if the user is asking for deeper/CLI diagnostics.
 */
function wantsDiagnostics(message: string): boolean {
  const lower = message.toLowerCase()
  const triggers = [
    'run diagnostics', 'run a diagnostic', 'run commands',
    'check my system', 'check my machine', 'check my computer',
    'go deeper', 'deeper analysis', 'deeper look',
    'scan my', 'diagnose my', 'analyze my',
    'run a scan', 'system check', 'health check',
    'can you check', 'please check',
  ]
  return triggers.some((t) => lower.includes(t))
}

/**
 * Get the user's platform from device scan, or detect from conversation.
 */
async function getDevicePlatform(
  workspaceId: string,
  slackUserId: string,
): Promise<'darwin' | 'win32' | 'linux'> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('device_scans' as any)
    .select('os_name')
    .eq('workspace_id', workspaceId)
    .eq('slack_user_id', slackUserId)
    .order('scanned_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const osName = (data as any)?.os_name?.toLowerCase() || ''
  if (osName.includes('mac') || osName.includes('darwin')) return 'darwin'
  if (osName.includes('windows') || osName.includes('win')) return 'win32'
  if (osName.includes('linux') || osName.includes('ubuntu')) return 'linux'

  return 'darwin' // default
}

/**
 * Post a Block Kit message.
 */
async function postBlockMessage(
  botToken: string,
  channel: string,
  blocks: any[],
  threadTs?: string,
): Promise<void> {
  await fetch(`${SLACK_API}/chat.postMessage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel,
      blocks,
      text: 'Diagnostic request',
      thread_ts: threadTs,
    }),
  })
}

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
  } catch { /* non-critical */ }
}
