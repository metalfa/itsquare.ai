import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

// Slack OAuth scopes required for the bot.
// Only request scopes that are actively used — Slack App Directory requires justification for each.
const SLACK_BOT_SCOPES = [
  'app_mentions:read',   // Receive events when users @mention the bot
  'channels:history',   // Read messages in public channels the bot is added to (for @mention context)
  'channels:read',      // Look up channel info to verify bot membership
  'chat:write',         // Send IT support responses and diagnostic prompts
  'commands',           // Handle /itsquare slash command
  'groups:history',     // Read messages in private channels the bot is added to
  'groups:read',        // Look up private channel info
  'im:history',         // Read DM conversation history for multi-turn support sessions
  'im:read',            // Check DM channel status
  'im:write',           // Open DM channels to send onboarding messages
  'reactions:read',     // Read emoji reactions to detect user feedback on responses
  'reactions:write',    // Add ✅/⏳ reactions to indicate bot processing status
  'team:read',          // Read workspace name and domain for multi-tenant identification
  'users:read',         // Look up Slack user details for support context
  'users:read.email',   // Match Slack users to dashboard accounts by email
].join(',')

// User scopes — only requested during sign-up/sign-in flow to get dashboard identity.
const SLACK_USER_SCOPES = [
  'identity.basic',   // Get user's Slack ID and display name for account creation
  'identity.email',   // Get user's email to create/link their dashboard account
  'identity.avatar',  // Get user's profile photo for dashboard display
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
