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
import { chooseDiagnosticSet } from '@/lib/services/auto-diagnostic'
import { randomUUID } from 'crypto'

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
    version: 'resolution-engine-v5',
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

  // Post "Working on it..." — will update in-place
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

    // Save user message
    await saveMessage(workspace.id, slackUserDbId, channelId, threadTs, 'user', userMessage, messageTs)
    incrementMessageCount(thread.id).catch(() => {})

    // Extract topic on first message
    if (thread.messageCount === 0 && thread.id) {
      extractAndStoreTopic(thread.id, userMessage).catch(() => {})
    }

    // Get thread history
    const history = await getThreadHistory(channelId, threadTs)

    // Check if user has recent device scan data
    const deviceScan = await getDeviceScanData(workspace.id, userId)
    const hasDeviceData = !!deviceScan
    const wantsDeeper = detectDeeperIntent(userMessage)
    const isTroubleshooting = detectTroubleshootingIntent(userMessage)

    // Generate AI response
    const aiResponse = await generateITResponse(
      userMessage,
      history,
      workspace.id,
      userId,
    )

    // Clean structured blocks from the response
    const cleanResponse = aiResponse
      .replace(/\[COMMANDS\][\s\S]*?\[\/COMMANDS\]/g, '')
      .replace(/\[DIAGNOSTIC\][\s\S]*?\[\/DIAGNOSTIC\]/g, '')
      .replace(/\[FIX\][\s\S]*?\[\/FIX\]/g, '')
      .trim()

    const finalResponse = cleanResponse || "I need a bit more info to help. Can you describe what's happening in more detail?"

    // Save AI response
    await saveMessage(workspace.id, slackUserDbId, channelId, threadTs, 'assistant', finalResponse)

    // Decide how to respond: single unified message
    // Show scan button ONLY for troubleshooting issues without device data, or explicit "go deeper"
    // Simple questions (wifi password, how do I, etc.) just get a text answer
    const needsScan = wantsDeeper || (isTroubleshooting && !hasDeviceData)
    console.log(`[ITSquare] Decision: hasDeviceData=${hasDeviceData}, isTroubleshooting=${isTroubleshooting}, wantsDeeper=${wantsDeeper}, needsScan=${needsScan}`)

    if (needsScan) {
      // Create diagnostic token
      const diagToken = randomUUID()
      const conversationSummary = history
        .slice(-6)
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n')
      const diagSet = await chooseDiagnosticSet(conversationSummary + '\n' + userMessage)

      await supabase.from('web_diagnostics' as any).insert({
        workspace_id: workspace.id,
        slack_user_id: userId,
        channel_id: channelId,
        thread_ts: threadTs,
        token: diagToken,
        issue_type: diagSet,
      })

      const diagUrl = `https://itsquare.ai/check/${diagToken}`

      // Build unified Block Kit message: AI response + scan button
      const blocks: any[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: wantsDeeper
              ? '🔍 Let me take another look at your machine to dig deeper.'
              : finalResponse,
          },
        },
        { type: 'divider' },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🖥️ *Quick scan — takes 5 seconds, no install needed:*',
          },
        },
        {
          type: 'actions',
          block_id: `diag_link_${diagToken}`,
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '🔍 Scan My Machine', emoji: true },
              style: 'primary',
              url: diagUrl,
              action_id: 'diag_web_link',
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '_Checks basic device info (OS, RAM, connection). No personal files or data are accessed._',
            },
          ],
        },
      ]

      // Update the thinking message with blocks
      if (thinkingTs) {
        await updateSlackMessageBlocks(botToken, channelId, thinkingTs, blocks,
          wantsDeeper ? 'Let me take another look at your machine.' : finalResponse)
      } else {
        await postBlockMessage(botToken, channelId, blocks, threadTs)
      }
    } else {
      // Has device data or not first message — just send the AI response
      if (thinkingTs) {
        await updateSlackMessage(botToken, channelId, thinkingTs, finalResponse)
      } else {
        await postMessage(botToken, channelId, finalResponse, threadTs)
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
 * Get full device scan data for a user.
 */
async function getDeviceScanData(workspaceId: string, slackUserId: string): Promise<any | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('device_scans' as any)
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('slack_user_id', slackUserId)
    .order('scanned_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  const row = data as any
  // Only use scan data less than 7 days old
  const age = Date.now() - new Date(row.scanned_at).getTime()
  if (age > 7 * 24 * 60 * 60 * 1000) return null

  // Quality check: browser-only scans have disk_total_gb from StorageManager
  // (browser quota, not real disk) and ram_total_gb from navigator.deviceMemory
  // but lack ram_available_gb, uptime_days, and top_processes.
  // These shallow scans can't drive a real diagnosis — require at least one
  // "deep" field that only comes from a real agent or enhanced scan.
  const hasDeepData = (
    row.ram_available_gb != null ||
    row.uptime_days != null ||
    (row.top_processes && row.top_processes.length > 0) ||
    (row.raw_scan?.cpuScore != null) ||
    (row.raw_scan?.speedTestDownloadMbps != null)
  )
  if (!hasDeepData) {
    console.log('[ITSquare] Shallow scan detected — treating as no device data')
    return null
  }

  return row
}

/**
 * Detect if this is a troubleshooting/device issue that benefits from a scan.
 * Returns false for simple questions (wifi password, how do I, setup help, etc.)
 */
function detectTroubleshootingIntent(message: string): boolean {
  const lower = message.toLowerCase()

  // Simple question patterns — NO scan needed
  const simplePatterns = [
    'password', 'how do i', 'how to', 'what is', 'what\'s the',
    'where is', 'where do', 'can i', 'set up', 'setup',
    'install', 'download', 'link', 'url', 'login', 'log in',
    'sign in', 'account', 'access', 'permission', 'reset my',
    'forgot', 'update my', 'change my', 'enable', 'disable',
    'turn on', 'turn off', 'schedule', 'meeting', 'calendar',
    'email', 'teams', 'zoom', 'print', 'printer',
    'thank', 'thanks', 'ok', 'okay', 'got it', 'never mind',
  ]
  if (simplePatterns.some((p) => lower.includes(p))) return false

  // Troubleshooting patterns — scan IS useful
  const troublePatterns = [
    'slow', 'fast', 'speed', 'laggy', 'lag', 'frozen', 'freeze',
    'crash', 'crashing', 'not working', 'not responding', 'stuck',
    'doesnt work', 'doesn\'t work', 'dont work', 'don\'t work',
    'stopped working', 'won\'t work', 'wont work', 'not functioning',
    'won\'t load', 'won\'t open', 'won\'t start', 'won\'t connect',
    'can\'t connect', 'cant connect', 'no internet', 'disconnecting', 'dropping',
    'blue screen', 'error', 'failed', 'failing', 'broken',
    'battery', 'overheating', 'hot', 'noisy', 'fan',
    'out of space', 'disk full', 'storage', 'memory',
    'wifi', 'wi-fi', 'network', 'internet', 'vpn',
    'taking forever', 'takes long', 'performance',
  ]
  if (troublePatterns.some((p) => lower.includes(p))) return true

  // Default: don't scan for ambiguous messages
  return false
}

/**
 * Detect if the user wants deeper diagnostics.
 * Uses fuzzy matching to handle typos like "goo peeper" → "go deeper"
 */
function detectDeeperIntent(message: string): boolean {
  const lower = message.toLowerCase().trim()

  // Exact/substring matches
  const exactTriggers = [
    'go deeper', 'deeper', 'scan my', 'diagnose my', 'check my',
    'run diagnostics', 'run a scan', 'health check', 'system check',
    'analyze my', 'deeper analysis', 'deeper look',
    'please check', 'can you check',
  ]
  if (exactTriggers.some((t) => lower.includes(t))) return true

  // Fuzzy match for common typos — check if any 2-word combo is close to "go deeper"
  const words = lower.split(/\s+/)
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + ' ' + words[i + 1]
    if (levenshtein(bigram, 'go deeper') <= 3) return true
    if (levenshtein(bigram, 'run scan') <= 2) return true
    if (levenshtein(bigram, 'check machine') <= 3) return true
    if (levenshtein(bigram, 'diagnose machine') <= 3) return true
  }

  // Single word fuzzy
  for (const word of words) {
    if (levenshtein(word, 'deeper') <= 2) return true
    if (levenshtein(word, 'diagnose') <= 2) return true
    if (levenshtein(word, 'diagnostic') <= 2) return true
    if (levenshtein(word, 'diagnostics') <= 2) return true
  }

  return false
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= a.length; i++) matrix[i] = [i]
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }
  return matrix[a.length][b.length]
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

async function updateSlackMessageBlocks(
  botToken: string,
  channel: string,
  messageTs: string,
  blocks: any[],
  fallbackText: string,
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
        blocks,
        text: fallbackText,
      }),
    })
  } catch { /* non-critical */ }
}
