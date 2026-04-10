/**
 * Slack slash command handler: /itsquare
 * Responds ephemerally via response_url.
 *
 * Flow: Slack → ack 200 immediately → process async → POST to response_url
 */

import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { respondToCommand } from '@/lib/services/slack-api'
import { generateITResponse } from '@/lib/services/ai'
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
    const userName = formData.get('user_name')?.toString() || ''
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
      await processCommand(text, userName, responseUrl, teamId)
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
  userName: string,
  responseUrl: string,
  teamId: string,
) {
  try {
    let response: string

    if (!text || text.toLowerCase() === 'help') {
      response = HELP_MESSAGE
    } else {
      // Look up workspace ID so RAG can pull knowledge base context
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

      response = await generateITResponse(
        `Employee ${userName} says: ${text}`,
        [],
        workspaceId,
      )
    }

    await respondToCommand(responseUrl, response)
  } catch (error) {
    console.error('[ITSquare] Process command error:', error)
    await respondToCommand(
      responseUrl,
      "I had trouble processing that. Try again or type `/itsquare help`.",
    ).catch(() => {})
  }
}
