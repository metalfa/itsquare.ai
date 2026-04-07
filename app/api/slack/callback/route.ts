import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptToken } from '@/lib/slack/encryption'
import type { SlackOAuthResponse } from '@/lib/slack/types'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  
  const cookieStore = await cookies()
  const storedState = cookieStore.get('slack_oauth_state')?.value
  const orgId = cookieStore.get('slack_oauth_org_id')?.value
  
  // Clear OAuth cookies
  cookieStore.delete('slack_oauth_state')
  cookieStore.delete('slack_oauth_org_id')
  
  // Handle errors from Slack
  if (error) {
    console.error('Slack OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=slack_oauth_denied`
    )
  }
  
  // Verify state for CSRF protection
  if (!state || state !== storedState) {
    console.error('Slack OAuth state mismatch')
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=invalid_state`
    )
  }
  
  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=no_code`
    )
  }
  
  try {
    // Exchange code for access token
    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://itsquare.ai'}/api/slack/callback`
    
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
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=token_exchange_failed`
      )
    }
    
    // Encrypt the bot token before storing
    const encryptedBotToken = encryptToken(tokenData.access_token)
    
    const supabase = createAdminClient()
    
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
      
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?success=slack_updated`
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
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=save_failed`
      )
    }
    
    // Create the installing user record
    await supabase
      .from('slack_users')
      .insert({
        workspace_id: newWorkspace.id,
        slack_user_id: tokenData.authed_user.id,
        is_admin: true, // Installer is typically an admin
      })
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?success=slack_installed`
    )
  } catch (err) {
    console.error('Slack OAuth callback error:', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=unexpected_error`
    )
  }
}
