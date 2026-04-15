import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

// Slack OAuth scopes.
// Bot scopes: current functionality + planned roadmap (M6 escalation, M8 fleet, M9 runbooks).
// All scopes are justified in the App Directory submission via Manage Reasons.
const SLACK_BOT_SCOPES = [
  // ── Active today ──────────────────────────────────────────────────────────
  'app_mentions:read',    // Receive @mention events from employees in any channel
  'channels:history',     // Read thread context in public channels for multi-turn support
  'channels:read',        // Verify bot membership and read channel metadata
  'chat:write',           // Send IT support responses, diagnostic links, Block Kit messages
  'commands',             // Handle /itsquare slash command
  'groups:history',       // Read thread context in private channels (e.g. #it-support)
  'groups:read',          // Verify membership and metadata for private channels
  'im:history',           // Read DM conversation history for multi-turn support sessions
  'im:read',              // Check DM channel status
  'im:write',             // Send onboarding DM; notify IT staff during escalation (M6)
  'reactions:read',       // Detect ✅ reactions to trigger resolution tracking (M5)
  'reactions:write',      // Add ⏳/✅ reactions as real-time processing status
  'team:read',            // Read workspace name/domain for multi-tenant identification
  'users:read',           // Look up employee profile for personalization and escalation routing
  'users:read.email',     // Match Slack users to dashboard accounts by email

  // ── Roadmap (M6 smart escalation, M8 fleet dashboard, M9 runbooks) ───────
  'assistant:write',      // M8: Participate in Slack AI assistant panel for contextual IT support
  'bookmarks:read',       // M9: Read pinned runbooks/KB articles in IT channels
  'bookmarks:write',      // M9: Auto-bookmark verified solutions in IT channels
  'calls:read',           // M6: Detect call quality issues and trigger proactive diagnostics
  'calls:write',          // M6: Start Slack call with IT member when chat escalation fails
  'incoming-webhook',     // M8: Post fleet health alerts and pattern reports to IT alert channel
  'mpim:history',         // Support IT triage conversations in group DMs
  'mpim:read',            // Check group DM status and metadata
].join(',')

// User scopes — ONLY these 3 for standard workspaces.
// identity.team, identify, openid, admin.*, calls:write require Enterprise Grid
// approval from Slack and break OAuth for all standard workspaces when requested.
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
