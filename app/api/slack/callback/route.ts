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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  
  const cookieStore = await cookies()
  const storedState = cookieStore.get('slack_oauth_state')?.value
  const orgId = cookieStore.get('slack_oauth_org_id')?.value
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
    
    // For sign-up/sign-in flow, we need user identity
    if (isAuthFlow) {
      // Get user info using the authed_user token
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
      const teamName = tokenData.team.name
      
      // Check if user already exists in Supabase
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, org_id')
        .eq('email', userEmail)
        .single()
      
      let userId: string
      let userOrgId: string | null = null
      
      if (existingUser) {
        // User exists - sign them in
        if (mode === 'signup') {
          // User trying to sign up but already has an account - redirect to login
          return NextResponse.redirect(
            `${baseUrl}/auth/login?message=account_exists`
          )
        }
        
        userId = existingUser.id
        userOrgId = existingUser.org_id
      } else {
        // New user - create account
        if (mode === 'signin') {
          // User trying to sign in but doesn't have an account
          return NextResponse.redirect(
            `${baseUrl}/auth/sign-up?message=no_account`
          )
        }
        
        // Create organization first (use Slack team name)
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: teamName,
            subscription_tier: 'free',
          })
          .select('id')
          .single()
        
        if (orgError || !newOrg) {
          console.error('Failed to create organization:', orgError)
          return NextResponse.redirect(
            `${baseUrl}${errorRedirect}?error=org_creation_failed`
          )
        }
        
        userOrgId = newOrg.id
        
        // Create user in auth.users via Supabase auth admin
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userEmail,
          email_confirm: true, // Auto-confirm since they verified via Slack
          user_metadata: {
            full_name: userName,
            avatar_url: userAvatar,
            slack_user_id: slackUserId,
            provider: 'slack',
          },
        })
        
        if (authError || !authData.user) {
          console.error('Failed to create auth user:', authError)
          // Rollback org creation
          await supabase.from('organizations').delete().eq('id', userOrgId)
          return NextResponse.redirect(
            `${baseUrl}${errorRedirect}?error=user_creation_failed`
          )
        }
        
        userId = authData.user.id
        
        // Create user profile in public.users
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail,
            full_name: userName,
            org_id: userOrgId,
            role: 'admin', // First user is admin
          })
        
        if (profileError) {
          console.error('Failed to create user profile:', profileError)
          // Attempt cleanup
          await supabase.auth.admin.deleteUser(userId)
          await supabase.from('organizations').delete().eq('id', userOrgId)
          return NextResponse.redirect(
            `${baseUrl}${errorRedirect}?error=profile_creation_failed`
          )
        }
      }
      
      // Now save/update the Slack workspace
      const encryptedBotToken = encryptToken(tokenData.access_token)
      
      // Check if workspace already exists
      const { data: existingWorkspace } = await supabase
        .from('slack_workspaces')
        .select('id')
        .eq('team_id', tokenData.team.id)
        .single()
      
      let workspaceId: string
      
      if (existingWorkspace) {
        // Update existing workspace
        await supabase
          .from('slack_workspaces')
          .update({
            team_name: tokenData.team.name,
            bot_token_encrypted: encryptedBotToken,
            bot_user_id: tokenData.bot_user_id,
            installed_by_slack_user_id: slackUserId,
            scopes: tokenData.scope.split(','),
            status: 'active',
            is_enterprise: !!tokenData.enterprise,
            enterprise_id: tokenData.enterprise?.id || null,
            org_id: userOrgId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingWorkspace.id)
        
        workspaceId = existingWorkspace.id
      } else {
        // Create new workspace
        const { data: newWorkspace, error: wsError } = await supabase
          .from('slack_workspaces')
          .insert({
            team_id: tokenData.team.id,
            team_name: tokenData.team.name,
            team_domain: tokenData.team.name.toLowerCase().replace(/\s+/g, '-'),
            bot_token_encrypted: encryptedBotToken,
            bot_user_id: tokenData.bot_user_id,
            installed_by_slack_user_id: slackUserId,
            scopes: tokenData.scope.split(','),
            is_enterprise: !!tokenData.enterprise,
            enterprise_id: tokenData.enterprise?.id || null,
            org_id: userOrgId,
          })
          .select('id')
          .single()
        
        if (wsError || !newWorkspace) {
          console.error('Failed to create workspace:', wsError)
          // Continue anyway - user account was created
        } else {
          workspaceId = newWorkspace.id
        }
      }
      
      // Create/update slack_user record and link to user
      const { data: existingSlackUser } = await supabase
        .from('slack_users')
        .select('id')
        .eq('workspace_id', workspaceId!)
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
            workspace_id: workspaceId!,
            slack_user_id: slackUserId,
            user_id: userId,
            display_name: userName,
            email: userEmail,
            avatar_url: userAvatar,
            is_admin: true,
          })
      }
      
      // Create session for the user
      // Generate a magic link and redirect to it
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail,
        options: {
          redirectTo: `${baseUrl}/dashboard`,
        },
      })
      
      if (linkError || !linkData.properties?.hashed_token) {
        console.error('Failed to generate magic link:', linkError)
        // Fallback: redirect to login with success message
        return NextResponse.redirect(
          `${baseUrl}/auth/login?message=slack_connected&email=${encodeURIComponent(userEmail)}`
        )
      }
      
      // Fire-and-forget welcome DM (does not block the redirect)
      sendWelcomeDm(encryptedBotToken, slackUserId).catch(() => {})

      // Redirect to the magic link verification endpoint
      const verifyUrl = `${baseUrl}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=magiclink&next=/dashboard`
      return NextResponse.redirect(verifyUrl)
    }
    
    // Non-auth flow (just app installation from dashboard)
    const encryptedBotToken = encryptToken(tokenData.access_token)
    
    // Check if workspace already exists
    const { data: existingWorkspace } = await supabase
      .from('slack_workspaces')
      .select('id')
      .eq('team_id', tokenData.team.id)
      .single()
    
    if (existingWorkspace) {
      // Update existing workspace
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
          org_id: orgId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingWorkspace.id)

      // Fire-and-forget welcome DM
      sendWelcomeDm(encryptedBotToken, tokenData.authed_user.id).catch(() => {})

      return NextResponse.redirect(
        `${baseUrl}/dashboard/integrations?success=slack_updated`
      )
    }
    
    // Create new workspace record
    const { data: newWorkspace, error: insertError } = await supabase
      .from('slack_workspaces')
      .insert({
        team_id: tokenData.team.id,
        team_name: tokenData.team.name,
        bot_token_encrypted: encryptedBotToken,
        bot_user_id: tokenData.bot_user_id,
        installed_by_slack_user_id: tokenData.authed_user.id,
        scopes: tokenData.scope.split(','),
        is_enterprise: !!tokenData.enterprise,
        enterprise_id: tokenData.enterprise?.id || null,
        org_id: orgId || null,
      })
      .select('id')
      .single()
    
    if (insertError || !newWorkspace) {
      console.error('Failed to save workspace:', insertError)
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

    // Fire-and-forget welcome DM
    sendWelcomeDm(encryptedBotToken, tokenData.authed_user.id).catch(() => {})

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
