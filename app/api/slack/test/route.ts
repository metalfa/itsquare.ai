import { NextResponse } from 'next/server'

// Simple test endpoint to verify Slack configuration
export async function GET() {
  const config = {
    timestamp: new Date().toISOString(),
    environment: {
      SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN ? '✓ Set' : '✗ Missing',
      SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET ? '✓ Set' : '✗ Missing',
      SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID ? '✓ Set' : '✗ Missing',
      SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
      REDIS_URL: process.env.REDIS_URL ? '✓ Set' : '✗ Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing',
    },
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.vercel.app'}/api/webhooks/slack`,
    status: 'OK',
    message: 'Use this webhook URL in your Slack app manifest',
  }
  
  return NextResponse.json(config, { status: 200 })
}

// Handle POST for testing webhook delivery
export async function POST(request: Request) {
  console.log('[v0] Test webhook POST received')
  
  try {
    const contentType = request.headers.get('content-type') || ''
    let body: any
    
    if (contentType.includes('application/json')) {
      body = await request.json()
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      body = Object.fromEntries(formData.entries())
    } else {
      body = await request.text()
    }
    
    console.log('[v0] Test webhook body:', JSON.stringify(body, null, 2))
    
    // Handle Slack URL verification
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge })
    }
    
    return NextResponse.json({
      received: true,
      body_type: typeof body,
      body_keys: typeof body === 'object' ? Object.keys(body) : [],
    })
  } catch (error) {
    console.error('[v0] Test webhook error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
