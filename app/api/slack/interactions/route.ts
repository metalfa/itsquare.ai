/**
 * Slack Interactivity handler.
 * Handles button clicks from diagnostic consent prompts.
 *
 * Actions:
 *   diag_consent_yes — User clicked [✅ Go ahead] for diagnostics
 *   diag_consent_no  — User clicked [❌ No thanks]
 *   fix_resolved     — User confirmed the fix worked
 *   fix_still_broken — User says still broken
 *   fix_escalate     — User wants human help
 */

import { NextResponse, after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptToken } from '@/lib/slack/encryption'
import { verifySlackSignature } from '@/lib/services/slack-verify'
import {
  approveRequest,
  rejectRequest,
} from '@/lib/services/execution-manager'
import { autoExtractToKB } from '@/lib/services/solution-tracker'

const SLACK_API = 'https://slack.com/api'

export async function POST(request: Request) {
  const rawBody = await request.text()

  const timestamp = request.headers.get('x-slack-request-timestamp') || ''
  const signature = request.headers.get('x-slack-signature') || ''
  const verification = verifySlackSignature(rawBody, timestamp, signature)

  if (!verification.valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const params = new URLSearchParams(rawBody)
  const payloadStr = params.get('payload')
  if (!payloadStr) {
    return NextResponse.json({ error: 'Missing payload' }, { status: 400 })
  }

  const payload = JSON.parse(payloadStr)

  if (payload.type === 'block_actions') {
    after(async () => {
      try {
        await handleBlockAction(payload)
      } catch (err) {
        console.error('[ITSquare] Interaction error:', err)
      }
    })
  }

  return new NextResponse(null, { status: 200 })
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/slack/interactions',
    timestamp: new Date().toISOString(),
  })
}

async function handleBlockAction(payload: any) {
  const action = payload.actions?.[0]
  if (!action) return

  const userId = payload.user?.id
  const teamId = payload.team?.id
  if (!teamId || !userId) return

  const supabase = createAdminClient()
  const { data: workspace } = await supabase
    .from('slack_workspaces')
    .select('id, bot_token_encrypted')
    .eq('team_id', teamId)
    .eq('status', 'active')
    .single()

  if (!workspace) return
  const botToken = decryptToken(workspace.bot_token_encrypted)
  const workspaceId = workspace.id

  const channelId = payload.channel?.id
  const messageTs = payload.message?.ts
  const threadTs = payload.message?.thread_ts || payload.message?.ts

  switch (action.action_id) {
    case 'diag_consent_yes': {
      // User approved diagnostics
      const requestId = action.value

      // Update the consent message to show approval
      if (channelId && messageTs) {
        await updateMessage(botToken, channelId, messageTs,
          '✅ *Diagnostics approved — running now...*\n:hourglass_flowing_sand: _Checking your system. This takes about 10 seconds._')
      }

      // Approve the execution request — CLI agent will pick it up
      await approveRequest(requestId, userId)

      // The CLI agent polls /api/agent/poll, executes commands,
      // and POSTs results to /api/agent/results.
      // The results handler feeds output to AI and posts interpretation.
      break
    }

    case 'diag_consent_no': {
      const requestId = action.value
      await rejectRequest(requestId)

      if (channelId && messageTs) {
        await updateMessage(botToken, channelId, messageTs,
          'No problem! Let me know if you change your mind or if there\'s anything else I can help with.')
      }
      break
    }

    case 'fix_resolved': {
      if (channelId && messageTs) {
        await updateMessage(botToken, channelId, messageTs,
          '✅ *Great, glad that\'s sorted!* I\'ll remember this solution for next time.')
      }
      // Update thread: mark resolved + bump times_worked
      if (threadTs && workspaceId) {
        await markResolution(workspaceId, channelId!, threadTs, 'resolved', true)
      }
      break
    }

    case 'fix_still_broken': {
      if (channelId && threadTs) {
        await updateMessage(botToken, channelId, messageTs!,
          '😞 Sorry that didn\'t work.')
        await postMessage(botToken, channelId,
          'Let me try a different approach. Can you tell me — when exactly did this start happening? Did anything change recently (new software, update, etc.)?',
          threadTs)
      }
      // Track failure: bump times_failed + lower confidence
      if (threadTs && workspaceId) {
        await markResolution(workspaceId, channelId!, threadTs, 'open', false)
      }
      break
    }

    case 'fix_escalate': {
      if (channelId && messageTs) {
        await updateMessage(botToken, channelId, messageTs,
          '🆘 *Escalating to the IT team.* I\'ll include everything we\'ve discussed so far so they have full context. Someone will reach out to you shortly.')
      }
      // Mark as escalated
      if (threadTs && workspaceId) {
        await markResolution(workspaceId, channelId!, threadTs, 'escalated', false)
      }
      break
    }
  }
}

// ---------------------------------------------------------------------------
// Slack Helpers
// ---------------------------------------------------------------------------

async function updateMessage(botToken: string, channel: string, ts: string, text: string) {
  await fetch(`${SLACK_API}/chat.update`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, ts, text, blocks: [] }),
  })
}

async function postMessage(botToken: string, channel: string, text: string, threadTs: string) {
  await fetch(`${SLACK_API}/chat.postMessage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, text, thread_ts: threadTs }),
  })
}

// ---------------------------------------------------------------------------
// Solution Effectiveness Tracking
// ---------------------------------------------------------------------------

/**
 * Update conversation_threads with resolution outcome.
 * - worked=true: bump times_worked, raise confidence, try auto-extract to KB
 * - worked=false: bump times_failed, lower confidence
 */
async function markResolution(
  workspaceId: string,
  channelId: string,
  threadTs: string,
  status: 'resolved' | 'escalated' | 'open',
  worked: boolean,
) {
  const supabase = createAdminClient()

  // Find the thread
  const { data: thread } = await supabase
    .from('conversation_threads')
    .select('id, resolution_summary, resolution_confidence, times_worked, times_failed')
    .eq('workspace_id', workspaceId)
    .eq('channel_id', channelId)
    .eq('thread_ts', threadTs)
    .maybeSingle()

  if (!thread) return

  const timesWorked = (thread.times_worked || 0) + (worked ? 1 : 0)
  const timesFailed = (thread.times_failed || 0) + (worked ? 0 : 1)

  // Confidence formula: success rate with Bayesian smoothing
  // Starts at 1.0, adjusts based on outcomes
  const totalOutcomes = timesWorked + timesFailed
  const confidence = totalOutcomes > 0
    ? (timesWorked + 1) / (totalOutcomes + 2) // Laplace smoothing
    : thread.resolution_confidence || 1.0

  const update: Record<string, any> = {
    status,
    times_worked: timesWorked,
    times_failed: timesFailed,
    resolution_confidence: Math.round(confidence * 100) / 100,
    updated_at: new Date().toISOString(),
  }

  if (status === 'resolved') {
    update.resolved_at = new Date().toISOString()
  }

  await supabase
    .from('conversation_threads')
    .update(update)
    .eq('id', thread.id)

  // If resolved with a summary, try to auto-extract to KB
  if (worked && thread.resolution_summary && confidence >= 0.6) {
    autoExtractToKB(workspaceId, thread.id, thread.resolution_summary).catch((err) =>
      console.error('[ITSquare] Auto-extract to KB failed:', err)
    )
  }
}
