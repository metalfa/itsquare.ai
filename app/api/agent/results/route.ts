/**
 * Agent Results API — receives command execution results from the CLI agent.
 *
 * POST /api/agent/results
 * Body: {
 *   request_id: string,
 *   results: [{ command, stdout, stderr, exitCode, tier, executedAt }],
 *   agent_version: string
 * }
 *
 * After receiving results:
 * 1. Store results on the execution request
 * 2. Build a context block with the results
 * 3. Feed results back to the AI for interpretation
 * 4. Post the AI's interpretation to the Slack thread
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptToken } from '@/lib/slack/encryption'
import { postMessage } from '@/lib/services/slack-api'
import { interpretDiagnosticResults } from '@/lib/services/auto-diagnostic'
import {
  submitResults,
  getExecutionRequest,
  type CommandResult,
} from '@/lib/services/execution-manager'

/**
 * POST — Receive execution results from CLI agent.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { request_id, results, agent_version } = body

    if (!request_id || !results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'request_id and results[] are required' },
        { status: 400 },
      )
    }

    // Validate results structure
    const validResults: CommandResult[] = results.map((r: any) => ({
      command: r.command || '',
      stdout: (r.stdout || '').substring(0, 5000),
      stderr: (r.stderr || '').substring(0, 2000),
      exitCode: typeof r.exitCode === 'number' ? r.exitCode : -1,
      tier: r.tier || 0,
      executedAt: r.executedAt || new Date().toISOString(),
    }))

    // Store results
    await submitResults(request_id, validResults, agent_version)

    // Get the execution request for context
    const execReq = await getExecutionRequest(request_id)
    if (!execReq) {
      return NextResponse.json({ success: true, interpreted: false })
    }

    // Feed results back to AI and post interpretation
    await interpretAndReply(execReq, validResults)

    return NextResponse.json({ success: true, interpreted: true })
  } catch (error) {
    console.error('[ITSquare] Agent results error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

/**
 * GET — Health check.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/agent/results',
    timestamp: new Date().toISOString(),
  })
}

/**
 * Feed command results to the AI and post interpretation to Slack.
 */
async function interpretAndReply(
  execReq: ReturnType<typeof getExecutionRequest> extends Promise<infer T> ? NonNullable<T> : never,
  results: CommandResult[],
) {
  const supabase = createAdminClient()

  // Get workspace for bot token
  const { data: workspace } = await supabase
    .from('slack_workspaces')
    .select('id, bot_token_encrypted')
    .eq('id', execReq.workspaceId)
    .eq('status', 'active')
    .single()

  if (!workspace) return

  const botToken = decryptToken(workspace.bot_token_encrypted)

  // Use the auto-diagnostic interpreter for clean, user-friendly output
  const interpretation = await interpretDiagnosticResults(
    execReq.purpose,
    results,
  )

  // Post interpretation to Slack thread
  await postMessage(botToken, execReq.channelId, interpretation, execReq.threadTs)

  // Post follow-up buttons
  const SLACK_API = 'https://slack.com/api'
  await fetch(`${SLACK_API}/chat.postMessage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: execReq.channelId,
      thread_ts: execReq.threadTs,
      text: 'Did that help?',
      blocks: [
        {
          type: 'actions',
          block_id: `fix_confirm_${execReq.threadTs}`,
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '✅ That fixed it!', emoji: true },
              style: 'primary',
              action_id: 'fix_resolved',
              value: execReq.threadTs,
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '😞 Still broken', emoji: true },
              action_id: 'fix_still_broken',
              value: execReq.threadTs,
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '🆘 Connect me with IT', emoji: true },
              action_id: 'fix_escalate',
              value: execReq.threadTs,
            },
          ],
        },
      ],
    }),
  })
}
