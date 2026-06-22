import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

// Slack OAuth scopes required for the bot
const SLACK_BOT_SCOPES = [
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
  'team:read',
].join(',')

// User scopes - needed to get user identity for sign-up/sign-in
const SLACK_USER_SCOPES = [
  'identity.basic',
  'identity.email',
  'identity.avatar',
].join(',')

export async function GET(request: Request) {
  const clientId = process.env.SLACK_CLIENT_ID
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'Slack integration not configured' },
      { status: 500 }
    )
  }
  
  const url = new URL(request.url)
  
  // Check if this is a sign-up/sign-in flow or just app installation
  const mode = url.searchParams.get('mode') // 'signup', 'signin', or null (install only)
  const orgId = url.searchParams.get('org_id')
  
  // Generate state for CSRF protection
  const state = randomBytes(32).toString('hex')
  
  // Store state and mode in cookie for verification
  const cookieStore = await cookies()
  cookieStore.set('slack_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })
  
  if (mode) {
    cookieStore.set('slack_oauth_mode', mode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    })
  }
  
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
  slackAuthUrl.searchParams.set('scope', SLACK_BOT_SCOPES)
  slackAuthUrl.searchParams.set('redirect_uri', redirectUri)
  slackAuthUrl.searchParams.set('state', state)
  
  // For signup/signin, also request user scopes to get their identity
  if (mode === 'signup' || mode === 'signin') {
    slackAuthUrl.searchParams.set('user_scope', SLACK_USER_SCOPES)
  }
  
  return NextResponse.redirect(slackAuthUrl.toString())
}
