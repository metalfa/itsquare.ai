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

// User scopes — requested during sign-up/sign-in and for Enterprise Grid (M7).
const SLACK_USER_SCOPES = [
  // ── Active today (sign-up/sign-in flow only) ──────────────────────────────
  'identity.basic',     // Get Slack user ID and name for dashboard account creation
  'identity.email',     // Get work email to create/link dashboard account
  'identity.avatar',    // Get profile photo for dashboard personalization
  'identity.team',      // Get workspace name for multi-workspace admin dashboard (M7)
  'identify',           // Base Slack identity scope required for SSO verification
  'openid',             // OIDC-compliant authentication for dashboard sign-in

  // ── Enterprise Grid / M7 Enterprise tier ─────────────────────────────────
  'admin',                      // M7: Centralized Enterprise Grid deployment and management
  'admin.analytics:read',       // M7: Workspace-wide IT support analytics for enterprise admins
  'admin.app_activities:read',  // M7: Audit logs for compliance reporting in regulated industries
  'admin.apps:read',            // M7: Manage app deployment across Enterprise Grid workspaces
  'calls:write',                // M6: Initiate Slack call from dashboard during critical escalation
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
