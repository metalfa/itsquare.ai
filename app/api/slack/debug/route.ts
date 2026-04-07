import { NextResponse } from 'next/server'

// Debug endpoint to verify Slack environment configuration
export async function GET() {
  const config = {
    botTokenSet: !!process.env.SLACK_BOT_TOKEN,
    signingSecretSet: !!process.env.SLACK_SIGNING_SECRET,
    redisUrlSet: !!process.env.REDIS_URL,
    encryptionKeySet: !!process.env.SLACK_TOKEN_ENCRYPTION_KEY,
    clientIdSet: !!process.env.SLACK_CLIENT_ID,
    clientSecretSet: !!process.env.SLACK_CLIENT_SECRET,
    webhookPath: '/api/webhooks/slack',
    timestamp: new Date().toISOString(),
  }
  
  const allSet = config.botTokenSet && config.signingSecretSet && config.redisUrlSet
  
  return NextResponse.json({
    status: allSet ? 'ready' : 'missing_config',
    config,
    message: allSet 
      ? 'All required environment variables are set. Make sure your Slack app Request URL is configured correctly.'
      : 'Missing required environment variables. Check SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, and REDIS_URL.',
  })
}
