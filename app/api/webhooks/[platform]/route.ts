import { after } from 'next/server'
import { bot } from '@/lib/slack/bot'

type Platform = keyof typeof bot.webhooks

export async function POST(
  request: Request,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params
  const handler = bot.webhooks[platform as Platform]
  
  if (!handler) {
    return new Response(`Unknown platform: ${platform}`, { status: 404 })
  }
  
  return handler(request, {
    waitUntil: (task) => after(() => task),
  })
}

// Handle Slack URL verification challenge
export async function GET(
  request: Request,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params
  
  if (platform !== 'slack') {
    return new Response('Not found', { status: 404 })
  }
  
  // Return 200 for health checks
  return new Response('ITSquare.AI Slack Bot is running', { status: 200 })
}
