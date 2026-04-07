import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

// Slack OAuth scopes required for the bot
const SLACK_SCOPES = [
  'app_mentions:read',
  'channels:history',
  'channels:read',
  'chat:write',
  'commands',
  'groups:history',
  'groups:read',
  'im:history',
  'im:read',
  'im:write',
  'mpim:history',
  'mpim:read',
  'reactions:read',
  'reactions:write',
  'users:read',
  'users:read.email',
].join(',')

export async function GET(request: Request) {
  const clientId = process.env.SLACK_CLIENT_ID
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'Slack integration not configured' },
      { status: 500 }
    )
  }
  
  // Generate state for CSRF protection
  const state = randomBytes(32).toString('hex')
  
  // Store state in cookie for verification
  const cookieStore = await cookies()
  cookieStore.set('slack_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })
  
  // Check if there's an org_id to associate with the installation
  const url = new URL(request.url)
  const orgId = url.searchParams.get('org_id')
  
  if (orgId) {
    cookieStore.set('slack_oauth_org_id', orgId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    })
  }
  
  // Build Slack OAuth URL
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://itsquare.ai'}/api/slack/callback`
  
  const slackAuthUrl = new URL('https://slack.com/oauth/v2/authorize')
  slackAuthUrl.searchParams.set('client_id', clientId)
  slackAuthUrl.searchParams.set('scope', SLACK_SCOPES)
  slackAuthUrl.searchParams.set('redirect_uri', redirectUri)
  slackAuthUrl.searchParams.set('state', state)
  
  return NextResponse.redirect(slackAuthUrl.toString())
}
