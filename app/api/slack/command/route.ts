import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

const SYSTEM_PROMPT = `You are ITSquare, a friendly and expert AI IT support assistant inside Slack.
Your job is to help employees solve technical problems quickly.

Rules:
- Be friendly, patient, and use simple non-technical language
- Give clear numbered step-by-step instructions
- Ask clarifying questions when needed (device type, OS, error messages)
- If you can't solve the problem, offer to escalate to the IT team
- Keep responses concise — this is Slack, not an email
- Use Slack formatting: *bold*, _italic_, \`code\`, bullet lists
- Never ask users to run terminal commands unless they're comfortable with it

If the user just says "help", show them what you can do.`

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/slack/command',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const text = formData.get('text')?.toString()?.trim() || ''
    const userId = formData.get('user_id')?.toString() || ''
    const userName = formData.get('user_name')?.toString() || ''
    const responseUrl = formData.get('response_url')?.toString() || ''
    const teamId = formData.get('team_id')?.toString() || ''

    // Process async — Slack requires <3s response
    after(async () => {
      await processCommand(text, userId, userName, responseUrl, teamId)
    })

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('[ITSquare] Slash command error:', error)
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Something went wrong. Please try again.',
    })
  }
}

async function processCommand(
  text: string,
  userId: string,
  userName: string,
  responseUrl: string,
  teamId: string,
) {
  try {
    let response: string

    if (!text || text.toLowerCase() === 'help') {
      response = getHelpMessage()
    } else {
      response = await getAIResponse(text, userName)
    }

    await fetch(responseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_type: 'ephemeral',
        text: response,
      }),
    })
  } catch (error) {
    console.error('[ITSquare] Process command error:', error)
    if (responseUrl) {
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_type: 'ephemeral',
          text: "I had trouble processing that. Try again or type `/itsquare help`.",
        }),
      }).catch(() => {})
    }
  }
}

async function getAIResponse(userMessage: string, userName: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      system: SYSTEM_PROMPT,
      prompt: `Employee ${userName} says: ${userMessage}`,
      maxOutputTokens: 500,
    })
    return text
  } catch (error) {
    console.error('[ITSquare] AI error:', error)
    return `I'm having trouble connecting right now. Here's what I'd suggest:\n\n1. Try restarting the affected device or app\n2. Check your internet connection\n3. Describe the problem again and I'll try once more\n\nOr type \`/itsquare help\` to see what I can help with.`
  }
}

function getHelpMessage(): string {
  return `*ITSquare — Your AI IT Assistant* :computer:\n\nJust describe your problem and I'll help solve it!\n\n*Examples:*\n• \`/itsquare my wifi keeps disconnecting\`\n• \`/itsquare computer is running slow\`\n• \`/itsquare can't connect to VPN\`\n• \`/itsquare printer not working\`\n• \`/itsquare forgot my password\`\n\nI'll give you step-by-step solutions. If I can't fix it, I'll connect you with IT.`
}
