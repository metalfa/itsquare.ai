import { after } from 'next/server'
import { bot } from '@/lib/slack/bot'

type Platform = keyof typeof bot.webhooks

export async function POST(
  request: Request,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params
  const contentType = request.headers.get('content-type') || ''
  
  // Handle Slack URL verification challenge
  if (platform === 'slack' && contentType.includes('application/json')) {
    const clonedRequest = request.clone()
    try {
      const body = await clonedRequest.json()
      if (body.type === 'url_verification') {
        return new Response(JSON.stringify({ challenge: body.challenge }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch {
      // Not JSON or parse error, continue to handler
    }
  }
  
  const handler = bot.webhooks[platform as Platform]
  
  if (!handler) {
    return new Response(`Unknown platform: ${platform}`, { status: 404 })
  }
  
  return handler(request, {
    waitUntil: (task) => after(() => task),
  })
}

// Health check endpoint
export async function GET(
  request: Request,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params
  
  if (platform !== 'slack') {
    return new Response('Not found', { status: 404 })
  }
  
  return new Response('ITSquare.AI Slack Bot is running', { status: 200 })
}
