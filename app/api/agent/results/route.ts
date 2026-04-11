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
import { generateITResponse } from '@/lib/services/ai'
import { getThreadHistory } from '@/lib/services/conversation'
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

  // Build results context for AI
  const resultsContext = results
    .map((r) => {
      const statusLabel = r.exitCode === 0 ? 'SUCCESS' : 'ERROR'
      const output = r.stdout || r.stderr || '(no output)'
      return `Command: ${r.command}\nStatus: ${statusLabel} (exit code ${r.exitCode})\nOutput:\n${output}`
    })
    .join('\n\n---\n\n')

  const resultsMessage =
    `Here are the command execution results. Please interpret them and continue diagnosing:\n\n${resultsContext}`

  // Get conversation history
  const history = await getThreadHistory(execReq.channelId, execReq.threadTs)

  // Generate AI interpretation
  const aiResponse = await generateITResponse(
    resultsMessage,
    history,
    execReq.workspaceId,
    execReq.slackUserId,
  )

  // Post to Slack thread
  await postMessage(botToken, execReq.channelId, aiResponse, execReq.threadTs)
}
