import { after } from 'next/server'
import { bot } from '@/lib/slack/bot'

type Platform = keyof typeof bot.webhooks

export async function POST(
  request: Request,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params
  const contentType = request.headers.get('content-type') || ''
  
  console.log('[v0] Webhook POST:', platform, 'Content-Type:', contentType)
  
  // Handle Slack URL verification challenge
  if (platform === 'slack') {
    // Only check for URL verification if content-type is JSON
    if (contentType.includes('application/json')) {
      const clonedRequest = request.clone()
      try {
        const body = await clonedRequest.json()
        console.log('[v0] Slack JSON body type:', body.type)
        
        // Handle URL verification challenge from Slack
        if (body.type === 'url_verification') {
          console.log('[v0] Responding to URL verification')
          return new Response(JSON.stringify({ challenge: body.challenge }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
      } catch (e) {
        console.log('[v0] JSON parse failed:', e)
      }
    } else {
      console.log('[v0] Non-JSON request (likely slash command)')
    }
  }
  
  const handler = bot.webhooks[platform as Platform]
  
  if (!handler) {
    console.log('[v0] Unknown platform:', platform)
    return new Response(`Unknown platform: ${platform}`, { status: 404 })
  }
  
  console.log('[v0] Passing to Chat SDK handler')
  
  try {
    const response = await handler(request, {
      waitUntil: (task) => after(() => task),
    })
    console.log('[v0] Chat SDK handler response status:', response.status)
    return response
  } catch (err) {
    console.error('[v0] Chat SDK handler error:', err)
    return new Response('Internal server error', { status: 500 })
  }
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
