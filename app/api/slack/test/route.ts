import { NextResponse } from 'next/server'

/**
 * Test endpoint — verifies environment configuration.
 * Only available in development. Returns 404 in production.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const config = {
    timestamp: new Date().toISOString(),
    environment: {
      SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET ? '✓ Set' : '✗ Missing',
      SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID ? '✓ Set' : '✗ Missing',
      SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
      SLACK_TOKEN_ENCRYPTION_KEY: process.env.SLACK_TOKEN_ENCRYPTION_KEY ? '✓ Set' : '✗ Missing',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing',
    },
    endpoints: {
      events: '/api/slack/events',
      command: '/api/slack/command',
      install: '/api/slack/install',
      callback: '/api/slack/callback',
    },
    status: 'OK',
  }

  return NextResponse.json(config, { status: 200 })
}
