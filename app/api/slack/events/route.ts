import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptToken } from '@/lib/slack/encryption'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import crypto from 'crypto'

const SYSTEM_PROMPT = `You are ITSquare, a friendly and expert AI IT support assistant inside Slack.
Your job is to help employees solve technical problems quickly.

Guidelines:
- Be friendly, patient, and use simple non-technical language
- Give clear step-by-step instructions
- Ask clarifying questions when needed (device type, OS, error messages)
- If you can't solve the problem, offer to escalate to the IT team
- Keep responses concise — this is Slack, not an email
- Use Slack formatting: *bold*, _italic_, \`code\`, bullet lists
- Never ask users to run terminal commands unless they're comfortable with it
- When continuing a conversation, use the thread history for context`

// Verify Slack request signature
function verifySlackSignature(
  body: string,
  timestamp: string,
  signature: string,
): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET
  if (!signingSecret) return false

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp)) > 300) return false

  const sigBasestring = `v0:${timestamp}:${body}`
  const hmac = crypto.createHmac('sha256', signingSecret)
  hmac.update(sigBasestring)
  const computed = `v0=${hmac.digest('hex')}`

  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature),
  )
}

async function slackPost(botToken: string, channel: string, text: string, threadTs?: string) {
  const body: Record<string, string> = { channel, text }
  if (threadTs) body.thread_ts = threadTs

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!data.ok) {
    console.error('[ITSquare] Slack API error:', data.error)
  }
  return data
}

async function getThreadHistory(
  channelId: string,
  threadTs: string,
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('slack_conversations')
    .select('message_role, message_content')
    .eq('channel_id', channelId)
    .eq('thread_ts', threadTs)
    .order('created_at', { ascending: true })
    .limit(20)

  if (!data) return []

  return data.map((m) => ({
    role: m.message_role as 'user' | 'assistant',
    content: m.message_content,
  }))
}

async function saveMessage(
  workspaceId: string,
  slackUserId: string,
  channelId: string,
  threadTs: string,
  role: 'user' | 'assistant',
  content: string,
  messageTs?: string,
) {
  const supabase = createAdminClient()
  await supabase.from('slack_conversations').insert({
    workspace_id: workspaceId,
    slack_user_id: slackUserId,
    channel_id: channelId,
    thread_ts: threadTs,
    message_role: role,
    message_content: content,
    message_ts: messageTs,
  })
}

// POST — Slack Events API
export async function POST(request: Request) {
  const rawBody = await request.text()

  const timestamp = request.headers.get('x-slack-request-timestamp') || ''
  const signature = request.headers.get('x-slack-signature') || ''

  if (!verifySlackSignature(rawBody, timestamp, signature)) {
    console.error('[ITSquare] Invalid Slack signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const body = JSON.parse(rawBody)

  // Handle URL verification challenge
  if (body.type === 'url_verification') {
    return NextResponse.json({ challenge: body.challenge })
  }

  // Handle events
  if (body.type === 'event_callback') {
    const event = body.event

    if (event.type === 'app_mention' || (event.type === 'message' && event.channel_type === 'im')) {
      // Ignore bot's own messages
      if (event.bot_id || event.subtype) return NextResponse.json({ ok: true })

      // Process async (Slack expects fast ack)
      handleMessage(body.team_id, event).catch((err) =>
        console.error('[ITSquare] handleMessage error:', err),
      )
    }
  }

  return NextResponse.json({ ok: true })
}

// GET — Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/slack/events',
    timestamp: new Date().toISOString(),
  })
}

async function handleMessage(teamId: string, event: any) {
  const supabase = createAdminClient()

  // Get workspace + bot token
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
  const channelId = event.channel
  const threadTs = event.thread_ts || event.ts
  const userId = event.user
  const userMessage = (event.text || '')
    .replace(/<@[A-Z0-9]+>/g, '') // Strip @mentions
    .trim()

  if (!userMessage) return

  // Upsert slack user
  const { data: existingUser } = await supabase
    .from('slack_users')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('slack_user_id', userId)
    .single()

  let slackUserDbId: string

  if (existingUser) {
    slackUserDbId = existingUser.id
    await supabase
      .from('slack_users')
      .update({ last_interaction_at: new Date().toISOString() })
      .eq('id', existingUser.id)
  } else {
    const { data: newUser } = await supabase
      .from('slack_users')
      .insert({ workspace_id: workspace.id, slack_user_id: userId })
      .select('id')
      .single()
    slackUserDbId = newUser?.id || userId
  }

  // Save user message
  await saveMessage(workspace.id, slackUserDbId, channelId, threadTs, 'user', userMessage, event.ts)

  // Get thread history for context
  const history = await getThreadHistory(channelId, threadTs)

  // Build message array
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  const lastHistoryMsg = history[history.length - 1]
  if (!lastHistoryMsg || lastHistoryMsg.content !== userMessage) {
    messages.push({ role: 'user' as const, content: userMessage })
  }

  let aiResponse: string

  try {
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      messages,
      maxOutputTokens: 500,
    })
    aiResponse = text
  } catch (aiError) {
    console.error('[ITSquare] AI error:', aiError)
    aiResponse = `I'm having a moment — let me try that again. Could you rephrase your question?\n\nOr type \`help\` if you want to see what I can do.`
  }

  // Save AI response
  await saveMessage(workspace.id, slackUserDbId, channelId, threadTs, 'assistant', aiResponse)

  // Post to Slack (in thread)
  await slackPost(botToken, channelId, aiResponse, threadTs)
}
