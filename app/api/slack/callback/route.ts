import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptToken, decryptToken } from '@/lib/slack/encryption'
import { openDirectMessage, postMessage } from '@/lib/services/slack-api'
import type { SlackOAuthResponse } from '@/lib/slack/types'

const WELCOME_MESSAGE = `👋 Hey! I'm ITSquare — your AI IT support agent.

I'm here to help your team solve IT problems without waiting for the IT team.

*Here's how to get started:*
• Just DM me with any IT question
• @mention me in any channel: _@ITSquare my laptop is slow_
• Use the slash command: _/itsquare wifi keeps dropping_

*What I can do:*
🔍 Diagnose issues (WiFi, slow Mac, app crashes, passwords)
📚 Search your company knowledge base
🛠️ Suggest and run safe diagnostic commands
📋 Escalate to your IT team when needed

Your workspace is on the *Free plan* — 50 messages/month included.
Upgrade anytime at https://itsquare.ai/dashboard/billing

Type anything to get started! 🚀`

/**
 * Send a welcome DM to the installing user. Fire-and-forget — never throws.
 */
async function sendWelcomeDm(botTokenEncrypted: string, slackUserId: string): Promise<void> {
  try {
    const botToken = decryptToken(botTokenEncrypted)
    const channelId = await openDirectMessage(botToken, slackUserId)
    if (channelId) {
      await postMessage(botToken, channelId, WELCOME_MESSAGE)
    }
  } catch (err) {
    console.error('[ITSquare] sendWelcomeDm error:', err)
  }
}

// OIDC userinfo response from https://slack.com/api/openid.connect.userInfo
interface SlackOIDCUserInfo {
  ok: boolean
  sub?: string          // Slack user ID
  name?: string         // Display name
  email?: string        // Work email
  picture?: string      // Avatar URL
  'https://slack.com/team_id'?: string
  'https://slack.com/team_name'?: string
  error?: string
}

/**
 * Slack OAuth callback.
 *
 * BUSINESS MODEL (1 workspace = 1 customer):
 * - Each Slack workspace is an independent customer
 * - Installing ITSquare on a workspace creates a dedicated organization for it
 * - The installing user becomes the admin for THAT workspace's organization
 * - If the same person installs on multiple workspaces, each gets its own org
 * - Dashboard always shows exactly one workspace per org
 * - Regular Slack users never see the dashboard — only the admin who installed
 *
 * TWO FLOWS:
 * 1. Auth flow (signup/signin): User clicks "Sign in with Slack" or "Sign up with Slack"
 *    → Creates user + org + workspace, signs them into dashboard
 * 2. Non-auth flow (reconnect): Admin clicks "Reconnect" from dashboard
 *    → Updates bot token for the existing workspace, no new org/user created
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  
  const cookieStore = await cookies()
  const storedState = cookieStore.get('slack_oauth_state')?.value
  const mode = cookieStore.get('slack_oauth_mode')?.value // 'signup', 'signin', or undefined
  
  // Clear OAuth cookies
  cookieStore.delete('slack_oauth_state')
  cookieStore.delete('slack_oauth_org_id')
  cookieStore.delete('slack_oauth_mode')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://itsquare.ai'
  const isAuthFlow = mode === 'signup' || mode === 'signin'
  const errorRedirect = isAuthFlow ? '/auth/login' : '/dashboard/integrations'
  
  // Handle errors from Slack
  if (error) {
    console.error('Slack OAuth error:', error)
    return NextResponse.redirect(
      `${baseUrl}${errorRedirect}?error=slack_oauth_denied`
    )
  }
  
  // Verify state for CSRF protection
  if (!state || state !== storedState) {
    console.error('Slack OAuth state mismatch')
    return NextResponse.redirect(
      `${baseUrl}${errorRedirect}?error=invalid_state`
    )
  }
  
  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}${errorRedirect}?error=no_code`
    )
  }
  
  try {
    // Exchange code for access token
    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET
    const redirectUri = `${baseUrl}/api/slack/callback`
    
    if (!clientId || !clientSecret) {
      throw new Error('Slack client credentials not configured')
    }
    
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })
    
    const tokenData: SlackOAuthResponse = await tokenResponse.json()
    
    if (!tokenData.ok) {
      console.error('Slack token exchange failed:', tokenData.error)
      return NextResponse.redirect(
        `${baseUrl}${errorRedirect}?error=token_exchange_failed`
      )
    }
    
    const supabase = createAdminClient()
    
    // ═══════════════════════════════════════════════════════════════════════
    // AUTH FLOW: Sign-up or sign-in via Slack
    // ═══════════════════════════════════════════════════════════════════════
    if (isAuthFlow) {
      const userToken = tokenData.authed_user?.access_token
      
      if (!userToken) {
        console.error('No user token received for auth flow')
        return NextResponse.redirect(
          `${baseUrl}${errorRedirect}?error=no_user_token`
        )
      }
      
      // Fetch user identity via OIDC userinfo endpoint (Marketplace-approved)
      const identityResponse = await fetch('https://slack.com/api/openid.connect.userInfo', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      })
      
      const identity: SlackOIDCUserInfo = await identityResponse.json()
      
      if (!identity.ok || !identity.email) {
        console.error('Failed to get OIDC user info:', identity.error)
        return NextResponse.redirect(
          `${baseUrl}${errorRedirect}?error=identity_failed`
        )
      }
      
      const userEmail = identity.email
      const userName = identity.name ?? userEmail.split('@')[0]
      const userAvatar = identity.picture
      const slackUserId = identity.sub!
      const teamId = tokenData.team.id
      const teamName = tokenData.team.name
      
      const encryptedBotToken = encryptToken(tokenData.access_token)
      
      // ─── Check if this workspace already exists ───────────────────────
      const { data: existingWorkspace } = await supabase
        .from('slack_workspaces')
        .select('id, org_id')
        .eq('team_id', teamId)
        .single()
      
      let workspaceId: string
      let workspaceOrgId: string
      
      if (existingWorkspace) {
        // Workspace exists — this is a re-install or sign-in
        workspaceId = existingWorkspace.id
        workspaceOrgId = existingWorkspace.org_id
        
        // Update workspace with fresh token
        await supabase
          .from('slack_workspaces')
          .update({
            team_name: teamName,
            bot_token_encrypted: encryptedBotToken,
            bot_user_id: tokenData.bot_user_id,
            installed_by_slack_user_id: slackUserId,
            scopes: tokenData.scope.split(','),
            status: 'active',
            is_enterprise: !!tokenData.enterprise,
            enterprise_id: tokenData.enterprise?.id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workspaceId)
        
        // If workspace had no org (legacy data), create one now
        if (!workspaceOrgId) {
          const { data: newOrg } = await supabase
            .from('organizations')
            .insert({ name: teamName, subscription_tier: 'free' })
            .select('id')
            .single()
          
          if (newOrg) {
            workspaceOrgId = newOrg.id
            await supabase
              .from('slack_workspaces')
              .update({ org_id: workspaceOrgId })
              .eq('id', workspaceId)
          }
        }
      } else {
        // ─── Brand new workspace install ────────────────────────────────
        // Each workspace gets its own organization (1 workspace = 1 customer)
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({ name: teamName, subscription_tier: 'free' })
          .select('id')
          .single()
        
        if (orgError || !newOrg) {
          console.error('Failed to create organization:', orgError)
          return NextResponse.redirect(
            `${baseUrl}${errorRedirect}?error=org_creation_failed`
          )
        }
        
        workspaceOrgId = newOrg.id
        
        const { data: newWorkspace, error: wsError } = await supabase
          .from('slack_workspaces')
          .insert({
            team_id: teamId,
            team_name: teamName,
            team_domain: tokenData.team.name.toLowerCase().replace(/\s+/g, '-'),
            bot_token_encrypted: encryptedBotToken,
            bot_user_id: tokenData.bot_user_id,
            installed_by_slack_user_id: slackUserId,
            scopes: tokenData.scope.split(','),
            is_enterprise: !!tokenData.enterprise,
            enterprise_id: tokenData.enterprise?.id || null,
            org_id: workspaceOrgId,
          })
          .select('id')
          .single()
        
        if (wsError || !newWorkspace) {
          console.error('Failed to create workspace:', wsError)
          // Rollback org
          await supabase.from('organizations').delete().eq('id', workspaceOrgId)
          return NextResponse.redirect(
            `${baseUrl}${errorRedirect}?error=workspace_creation_failed`
          )
        }
        
        workspaceId = newWorkspace.id
      }
      
      // ─── Create or find the dashboard user ────────────────────────────
      // Look up user by email. If they exist, link them to THIS workspace's org.
      // A user can only manage one workspace at a time from the dashboard.
      // If they switch workspaces, their org_id changes.
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, org_id')
        .eq('email', userEmail)
        .single()
      
      let userId: string
      
      if (existingUser) {
        userId = existingUser.id
        
        if (mode === 'signup') {
          // They have an account but are trying to sign up — just sign them in
          // and switch them to this workspace's org
        }
        
        // Update user to point to THIS workspace's organization
        // This is the key: signing in with a workspace = managing that workspace
        await supabase
          .from('users')
          .update({ org_id: workspaceOrgId })
          .eq('id', userId)
        
      } else {
        // New user
        if (mode === 'signin') {
          return NextResponse.redirect(
            `${baseUrl}/auth/sign-up?message=no_account`
          )
        }
        
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userEmail,
          email_confirm: true,
          user_metadata: {
            full_name: userName,
            avatar_url: userAvatar,
            slack_user_id: slackUserId,
            provider: 'slack',
          },
        })
        
        if (authError || !authData.user) {
          console.error('Failed to create auth user:', authError)
          return NextResponse.redirect(
            `${baseUrl}${errorRedirect}?error=user_creation_failed`
          )
        }
        
        userId = authData.user.id
        
        // Create profile linked to THIS workspace's org
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail,
            full_name: userName,
            org_id: workspaceOrgId,
            role: 'admin',
          })
        
        if (profileError) {
          console.error('Failed to create user profile:', profileError)
          await supabase.auth.admin.deleteUser(userId)
          return NextResponse.redirect(
            `${baseUrl}${errorRedirect}?error=profile_creation_failed`
          )
        }
      }
      
      // ─── Link Slack user to dashboard user ────────────────────────────
      const { data: existingSlackUser } = await supabase
        .from('slack_users')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('slack_user_id', slackUserId)
        .single()
      
      if (existingSlackUser) {
        await supabase
          .from('slack_users')
          .update({
            user_id: userId,
            display_name: userName,
            email: userEmail,
            avatar_url: userAvatar,
            is_admin: true,
            last_interaction_at: new Date().toISOString(),
          })
          .eq('id', existingSlackUser.id)
      } else {
        await supabase
          .from('slack_users')
          .insert({
            workspace_id: workspaceId,
            slack_user_id: slackUserId,
            user_id: userId,
            display_name: userName,
            email: userEmail,
            avatar_url: userAvatar,
            is_admin: true,
          })
      }
      
      // ─── Sign user in and redirect to dashboard ───────────────────────
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail,
        options: {
          redirectTo: `${baseUrl}/dashboard`,
        },
      })
      
      if (linkError || !linkData.properties?.hashed_token) {
        console.error('Failed to generate magic link:', linkError)
        return NextResponse.redirect(
          `${baseUrl}/auth/login?message=slack_connected&email=${encodeURIComponent(userEmail)}`
        )
      }
      
      // Fire-and-forget welcome DM
      sendWelcomeDm(encryptedBotToken, slackUserId).catch(() => {})

      const verifyUrl = `${baseUrl}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=magiclink&next=/dashboard`
      return NextResponse.redirect(verifyUrl)
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // NON-AUTH FLOW: Reconnect from dashboard (admin already signed in)
    // ═══════════════════════════════════════════════════════════════════════
    // This flow is ONLY for refreshing the bot token on an existing workspace.
    // The workspace already has an org. We just update the token.
    const encryptedBotToken = encryptToken(tokenData.access_token)
    
    // Resolve the admin's org from their session
    let adminOrgId: string | null = null
    try {
      const { createClient: createServerClient } = await import('@/lib/supabase/server')
      const userSupabase = await createServerClient()
      const { data: { user: sessionUser } } = await userSupabase.auth.getUser()
      if (sessionUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('org_id')
          .eq('id', sessionUser.id)
          .single()
        adminOrgId = profile?.org_id || null
      }
    } catch (e) {
      console.warn('[ITSquare] Could not resolve admin session:', e)
    }
    
    // Check if workspace already exists
    const { data: existingWorkspace } = await supabase
      .from('slack_workspaces')
      .select('id, org_id')
      .eq('team_id', tokenData.team.id)
      .single()
    
    if (existingWorkspace) {
      // Update existing workspace — keep its org_id (don't overwrite with admin's org)
      await supabase
        .from('slack_workspaces')
        .update({
          team_name: tokenData.team.name,
          bot_token_encrypted: encryptedBotToken,
          bot_user_id: tokenData.bot_user_id,
          installed_by_slack_user_id: tokenData.authed_user.id,
          scopes: tokenData.scope.split(','),
          status: 'active',
          is_enterprise: !!tokenData.enterprise,
          enterprise_id: tokenData.enterprise?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingWorkspace.id)

      sendWelcomeDm(encryptedBotToken, tokenData.authed_user.id).catch(() => {})

      return NextResponse.redirect(
        `${baseUrl}/dashboard/integrations?success=slack_updated`
      )
    }
    
    // New workspace from non-auth flow — create its own org
    // This happens if someone installs from the dashboard Reconnect button
    // but ends up on a different workspace in the Slack OAuth picker
    const orgName = tokenData.team.name
    const { data: newOrg } = await supabase
      .from('organizations')
      .insert({ name: orgName, subscription_tier: 'free' })
      .select('id')
      .single()
    
    const newOrgId = newOrg?.id || null

    const { data: newWorkspace, error: insertError } = await supabase
      .from('slack_workspaces')
      .insert({
        team_id: tokenData.team.id,
        team_name: tokenData.team.name,
        team_domain: tokenData.team.name.toLowerCase().replace(/\s+/g, '-'),
        bot_token_encrypted: encryptedBotToken,
        bot_user_id: tokenData.bot_user_id,
        installed_by_slack_user_id: tokenData.authed_user.id,
        scopes: tokenData.scope.split(','),
        is_enterprise: !!tokenData.enterprise,
        enterprise_id: tokenData.enterprise?.id || null,
        org_id: newOrgId,
      })
      .select('id')
      .single()
    
    if (insertError || !newWorkspace) {
      console.error('Failed to save workspace:', insertError)
      if (newOrgId) await supabase.from('organizations').delete().eq('id', newOrgId)
      return NextResponse.redirect(
        `${baseUrl}/dashboard/integrations?error=save_failed`
      )
    }
    
    // Create the installing user record
    await supabase
      .from('slack_users')
      .insert({
        workspace_id: newWorkspace.id,
        slack_user_id: tokenData.authed_user.id,
        is_admin: true,
      })

    sendWelcomeDm(encryptedBotToken, tokenData.authed_user.id).catch(() => {})

    // Switch the admin's profile to manage this new workspace
    if (adminOrgId && newOrgId) {
      try {
        const { createClient: createServerClient } = await import('@/lib/supabase/server')
        const userSupabase = await createServerClient()
        const { data: { user: sessionUser } } = await userSupabase.auth.getUser()
        if (sessionUser) {
          await supabase
            .from('users')
            .update({ org_id: newOrgId })
            .eq('id', sessionUser.id)
        }
      } catch { /* non-critical */ }
    }

    return NextResponse.redirect(
      `${baseUrl}/dashboard/integrations?success=slack_installed`
    )
  } catch (err) {
    console.error('Slack OAuth callback error:', err)
    return NextResponse.redirect(
      `${baseUrl}${isAuthFlow ? '/auth/login' : '/dashboard/integrations'}?error=unexpected_error`
    )
  }
}
