import { after } from 'next/server'
import { bot } from '@/lib/slack/bot'

type Platform = keyof typeof bot.webhooks

export async function POST(
  request: Request,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params
  
  // Handle Slack URL verification challenge
  // We need to clone the request to check for url_verification without consuming the body
  if (platform === 'slack') {
    const contentType = request.headers.get('content-type') || ''
    
    // Only check for URL verification if content-type is JSON
    if (contentType.includes('application/json')) {
      const clonedRequest = request.clone()
      try {
        const body = await clonedRequest.json()
        
        // Handle URL verification challenge from Slack
        if (body.type === 'url_verification') {
          return new Response(JSON.stringify({ challenge: body.challenge }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
      } catch {
        // JSON parse failed, continue to handler
      }
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
