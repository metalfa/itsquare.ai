import { after } from 'next/server'
import { bot } from '@/lib/slack/bot'

type Platform = keyof typeof bot.webhooks

export async function POST(
  request: Request,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params
  
  console.log('[v0] Webhook POST received for platform:', platform)
  
  // Handle Slack URL verification challenge (sent as POST with JSON body)
  if (platform === 'slack') {
    const clonedRequest = request.clone()
    try {
      const body = await clonedRequest.json()
      console.log('[v0] Slack webhook body type:', body.type)
      
      // Handle URL verification challenge
      if (body.type === 'url_verification') {
        console.log('[v0] Responding to Slack URL verification challenge')
        return new Response(JSON.stringify({ challenge: body.challenge }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch (e) {
      // Body might be form data for slash commands, continue to handler
      console.log('[v0] Body is not JSON, likely a slash command')
    }
  }
  
  const handler = bot.webhooks[platform as Platform]
  
  if (!handler) {
    console.log('[v0] Unknown platform:', platform)
    return new Response(`Unknown platform: ${platform}`, { status: 404 })
  }
  
  console.log('[v0] Passing to Chat SDK handler')
  
  return handler(request, {
    waitUntil: (task) => after(() => task),
  })
}

// Handle Slack URL verification challenge and health checks
export async function GET(
  request: Request,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params
  
  console.log('[v0] Webhook GET received for platform:', platform)
  
  if (platform !== 'slack') {
    return new Response('Not found', { status: 404 })
  }
  
  // Return 200 for health checks
  return new Response('ITSquare.AI Slack Bot is running', { status: 200 })
}
