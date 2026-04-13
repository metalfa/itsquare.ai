/**
 * Slack slash command handler: /itsquare
 *
 * Now uses the full Resolution Engine investigation.
 * Responds in-channel (not ephemeral) so colleagues can learn from answers.
 *
 * Flow: Slack → ack 200 immediately → process async → POST to response_url
 */

import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { respondToCommand } from '@/lib/services/slack-api'
import { generateITResponse } from '@/lib/services/ai'
// Command blocks are stripped since we don't expose CLI to end users
import { HELP_MESSAGE } from '@/lib/config/prompts'

/**
 * GET — Health check.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/slack/command',
    timestamp: new Date().toISOString(),
  })
}

/**
 * POST — Slack sends slash commands as form-encoded POST.
 * Must respond within 3 seconds, so we ack immediately and process in background.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const text = formData.get('text')?.toString()?.trim() || ''
    const userId = formData.get('user_id')?.toString() || ''
    const responseUrl = formData.get('response_url')?.toString() || ''
    const teamId = formData.get('team_id')?.toString() || ''

    if (!responseUrl) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Something went wrong. Please try again.',
      })
    }

    // Process asynchronously — Slack requires <3s ack
    after(async () => {
      await processCommand(text, userId, responseUrl, teamId)
    })

    // Ack immediately
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('[ITSquare] Slash command error:', error)
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Something went wrong. Please try again.',
    })
  }
}

/**
 * Background processor for slash commands.
 */
async function processCommand(
  text: string,
  userId: string,
  responseUrl: string,
  teamId: string,
) {
  try {
    if (!text || text.toLowerCase() === 'help') {
      // Help is ephemeral — only the user needs to see it
      await respondToCommand(responseUrl, HELP_MESSAGE, true)
      return
    }

    // Look up workspace ID for full investigation
    let workspaceId: string | undefined
    if (teamId) {
      const supabase = createAdminClient()
      const { data: workspace } = await supabase
        .from('slack_workspaces')
        .select('id')
        .eq('team_id', teamId)
        .eq('status', 'active')
        .single()
      workspaceId = workspace?.id
    }

    // Full Resolution Engine — pass userId for 4-source investigation
    const response = await generateITResponse(text, [], workspaceId, userId || undefined)

    // Clean any structured blocks from the response
    const finalResponse = response
      .replace(/\[COMMANDS\][\s\S]*?\[\/COMMANDS\]/g, '')
      .replace(/\[DIAGNOSTIC\][\s\S]*?\[\/DIAGNOSTIC\]/g, '')
      .replace(/\[FIX\][\s\S]*?\[\/FIX\]/g, '')
      .trim() || response

    // Post in-channel so others benefit from the answer
    await respondToCommand(responseUrl, finalResponse, false)
  } catch (error) {
    console.error('[ITSquare] Process command error:', error)
    await respondToCommand(
      responseUrl,
      "I had trouble processing that. Try again or type `/itsquare help`.",
      true,
    ).catch(() => {})
  }
}
