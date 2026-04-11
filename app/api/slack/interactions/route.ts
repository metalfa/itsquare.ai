/**
 * Slack Interactivity handler.
 * Receives button clicks, menu selections, and other interactive events.
 *
 * Flow: Slack → verify signature → ack 200 → process action
 *
 * Actions handled:
 *   exec_run_all — User clicked [▶ Run All]
 *   exec_review_each — User clicked [📋 Review Each]
 *   exec_skip — User clicked [❌ Skip]
 *   exec_approve_cmd — User approved a single command in review mode
 *   exec_skip_cmd — User skipped a single command in review mode
 *   exec_cancel_all — User cancelled all remaining commands
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptToken } from '@/lib/slack/encryption'
import { verifySlackSignature } from '@/lib/services/slack-verify'
import { postMessage } from '@/lib/services/slack-api'
import {
  approveRequest,
  rejectRequest,
  getExecutionRequest,
} from '@/lib/services/execution-manager'
import {
  buildReviewCommandBlock,
  buildManualExecutionBlocks,
} from '@/lib/services/slack-blocks'

const SLACK_API = 'https://slack.com/api'

/**
 * POST — Slack sends interactions as URL-encoded form data.
 */
export async function POST(request: Request) {
  const rawBody = await request.text()

  // Verify signature
  const timestamp = request.headers.get('x-slack-request-timestamp') || ''
  const signature = request.headers.get('x-slack-signature') || ''
  const verification = verifySlackSignature(rawBody, timestamp, signature)

  if (!verification.valid) {
    console.error('[ITSquare] Interaction signature failed:', verification.error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Parse the payload (URL-encoded, payload is JSON string)
  const params = new URLSearchParams(rawBody)
  const payloadStr = params.get('payload')
  if (!payloadStr) {
    return NextResponse.json({ error: 'Missing payload' }, { status: 400 })
  }

  const payload = JSON.parse(payloadStr)

  // Handle block actions (button clicks)
  if (payload.type === 'block_actions') {
    // Process async, ack immediately
    handleBlockAction(payload).catch((err) =>
      console.error('[ITSquare] Interaction handler error:', err),
    )
  }

  // Ack immediately (Slack expects <3s response)
  return new NextResponse(null, { status: 200 })
}

/**
 * GET — Health check.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/slack/interactions',
    timestamp: new Date().toISOString(),
  })
}

// ---------------------------------------------------------------------------
// Action Handlers
// ---------------------------------------------------------------------------

async function handleBlockAction(payload: any) {
  const action = payload.actions?.[0]
  if (!action) return

  const userId = payload.user?.id
  const teamId = payload.team?.id
  if (!teamId || !userId) return

  // Get bot token
  const supabase = createAdminClient()
  const { data: workspace } = await supabase
    .from('slack_workspaces')
    .select('id, bot_token_encrypted')
    .eq('team_id', teamId)
    .eq('status', 'active')
    .single()

  if (!workspace) return
  const botToken = decryptToken(workspace.bot_token_encrypted)

  switch (action.action_id) {
    case 'exec_run_all':
      await handleRunAll(action.value, userId, botToken, payload)
      break

    case 'exec_review_each':
      await handleReviewEach(action.value, userId, botToken, payload)
      break

    case 'exec_skip':
      await handleSkip(action.value, userId, botToken, payload)
      break

    case 'exec_approve_cmd':
      await handleApproveCommand(action.value, userId, botToken, payload)
      break

    case 'exec_skip_cmd':
      await handleSkipCommand(action.value, userId, botToken, payload)
      break

    case 'exec_cancel_all':
      await handleCancelAll(action.value, userId, botToken, payload)
      break
  }
}

// ---------------------------------------------------------------------------
// Run All
// ---------------------------------------------------------------------------

async function handleRunAll(
  requestId: string,
  userId: string,
  botToken: string,
  payload: any,
) {
  const execReq = await approveRequest(requestId, userId, 'interactive')
  if (!execReq) {
    await replyEphemeral(payload, 'This request has already been handled.')
    return
  }

  // Update the original message to show it's been approved
  await updateOriginalMessage(
    botToken,
    payload.channel?.id,
    payload.message?.ts,
    '✅ *Commands approved — waiting for execution...*\n\n' +
      'If you have the ITSquare CLI agent installed, commands will run automatically.\n' +
      'Otherwise, run these in your terminal:',
  )

  // Post manual execution instructions (until CLI agent is built)
  const manualBlocks = buildManualExecutionBlocks(execReq.commands)
  await postBlockMessage(botToken, execReq.channelId, manualBlocks, execReq.threadTs)
}

// ---------------------------------------------------------------------------
// Review Each
// ---------------------------------------------------------------------------

async function handleReviewEach(
  requestId: string,
  userId: string,
  botToken: string,
  payload: any,
) {
  const execReq = await approveRequest(requestId, userId, 'review_each')
  if (!execReq) {
    await replyEphemeral(payload, 'This request has already been handled.')
    return
  }

  // Update original message
  await updateOriginalMessage(
    botToken,
    payload.channel?.id,
    payload.message?.ts,
    '📋 *Reviewing commands one by one...*',
  )

  // Post first command for review
  if (execReq.commands.length > 0) {
    const blocks = buildReviewCommandBlock(requestId, 0, execReq.commands[0], execReq.commands.length)
    await postBlockMessage(botToken, execReq.channelId, blocks, execReq.threadTs)
  }
}

// ---------------------------------------------------------------------------
// Skip
// ---------------------------------------------------------------------------

async function handleSkip(
  requestId: string,
  userId: string,
  botToken: string,
  payload: any,
) {
  await rejectRequest(requestId)

  await updateOriginalMessage(
    botToken,
    payload.channel?.id,
    payload.message?.ts,
    '❌ *Command execution skipped.* No worries — describe what you\'re seeing and I\'ll keep troubleshooting from the conversation.',
  )
}

// ---------------------------------------------------------------------------
// Single Command Review
// ---------------------------------------------------------------------------

async function handleApproveCommand(
  valueJson: string,
  userId: string,
  botToken: string,
  payload: any,
) {
  const { requestId, index } = JSON.parse(valueJson)
  const execReq = await getExecutionRequest(requestId)
  if (!execReq) return

  const cmd = execReq.commands[index]

  // Post the approved command as a manual instruction
  await postMessage(
    botToken,
    payload.channel?.id || execReq.channelId,
    `✅ Approved. Run this in your terminal:\n\`\`\`${cmd.command}\`\`\`\n_${cmd.explanation}_`,
    execReq.threadTs,
  )

  // Show next command if there is one
  const nextIndex = index + 1
  if (nextIndex < execReq.commands.length) {
    const blocks = buildReviewCommandBlock(
      requestId,
      nextIndex,
      execReq.commands[nextIndex],
      execReq.commands.length,
    )
    await postBlockMessage(botToken, execReq.channelId, blocks, execReq.threadTs)
  } else {
    await postMessage(
      botToken,
      execReq.channelId,
      '📋 *All commands reviewed.* Share the outputs with me and I\'ll continue the diagnosis.',
      execReq.threadTs,
    )
  }
}

async function handleSkipCommand(
  valueJson: string,
  userId: string,
  botToken: string,
  payload: any,
) {
  const { requestId, index } = JSON.parse(valueJson)
  const execReq = await getExecutionRequest(requestId)
  if (!execReq) return

  // Show next command
  const nextIndex = index + 1
  if (nextIndex < execReq.commands.length) {
    const blocks = buildReviewCommandBlock(
      requestId,
      nextIndex,
      execReq.commands[nextIndex],
      execReq.commands.length,
    )
    await postBlockMessage(botToken, execReq.channelId, blocks, execReq.threadTs)
  } else {
    await postMessage(
      botToken,
      execReq.channelId,
      '📋 *All commands reviewed.* Share any outputs with me and I\'ll continue the diagnosis.',
      execReq.threadTs,
    )
  }
}

async function handleCancelAll(
  requestId: string,
  userId: string,
  botToken: string,
  payload: any,
) {
  await rejectRequest(requestId)
  await postMessage(
    botToken,
    payload.channel?.id,
    '🛑 *Command review cancelled.* No commands will be executed. Let me know if you want to try a different approach.',
    payload.message?.thread_ts,
  )
}

// ---------------------------------------------------------------------------
// Slack API Helpers
// ---------------------------------------------------------------------------

async function updateOriginalMessage(
  botToken: string,
  channel: string,
  messageTs: string,
  newText: string,
) {
  if (!channel || !messageTs) return

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
      blocks: [], // remove buttons
    }),
  })
}

async function postBlockMessage(
  botToken: string,
  channel: string,
  blocks: any[],
  threadTs?: string,
) {
  const body: any = {
    channel,
    blocks,
    text: 'Command execution request', // fallback text
  }
  if (threadTs) body.thread_ts = threadTs

  await fetch(`${SLACK_API}/chat.postMessage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

async function replyEphemeral(payload: any, text: string) {
  if (!payload.response_url) return

  await fetch(payload.response_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      response_type: 'ephemeral',
      text,
      replace_original: false,
    }),
  })
}
