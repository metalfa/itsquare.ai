import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAgentToken } from '@/lib/slack/encryption'

// POST - Generate a new agent token (called from Slack or dashboard)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workspace_id, slack_user_id, name, device_identifier } = body
    
    if (!workspace_id || !slack_user_id) {
      return NextResponse.json(
        { error: 'workspace_id and slack_user_id are required' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    
    // Verify the workspace exists
    const { data: workspace } = await supabase
      .from('slack_workspaces')
      .select('id, team_name')
      .eq('id', workspace_id)
      .single()
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }
    
    // Verify the user exists
    const { data: slackUser } = await supabase
      .from('slack_users')
      .select('id, display_name')
      .eq('id', slack_user_id)
      .single()
    
    if (!slackUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Generate the token
    const { token, prefix, hash } = await generateAgentToken()
    
    // Store the token hash (never store the actual token)
    const { data: tokenRecord, error } = await supabase
      .from('agent_tokens')
      .insert({
        token_hash: hash,
        token_prefix: prefix,
        workspace_id,
        slack_user_id,
        name: name || `${slackUser.display_name || 'User'}'s Device`,
        device_identifier,
        scopes: ['device:scan'],
        is_active: true,
        // Token expires in 1 year by default
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id, token_prefix, name, created_at, expires_at')
      .single()
    
    if (error) {
      console.error('Failed to create token:', error)
      return NextResponse.json(
        { error: 'Failed to create token' },
        { status: 500 }
      )
    }
    
    // Return the full token ONLY on creation (it cannot be retrieved later)
    return NextResponse.json({
      success: true,
      token, // Only returned once!
      token_id: tokenRecord.id,
      token_prefix: tokenRecord.token_prefix,
      name: tokenRecord.name,
      expires_at: tokenRecord.expires_at,
      message: 'Save this token securely. It cannot be retrieved again.',
    })
  } catch (err) {
    console.error('Token generation error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - List tokens for a user (shows only prefix, not full token)
export async function GET(request: Request) {
  const url = new URL(request.url)
  const slackUserId = url.searchParams.get('slack_user_id')
  
  if (!slackUserId) {
    return NextResponse.json(
      { error: 'slack_user_id is required' },
      { status: 400 }
    )
  }
  
  const supabase = createAdminClient()
  
  const { data: tokens, error } = await supabase
    .from('agent_tokens')
    .select('id, token_prefix, name, device_identifier, is_active, last_used_at, expires_at, created_at')
    .eq('slack_user_id', slackUserId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Failed to fetch tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    )
  }
  
  return NextResponse.json({ tokens })
}

// DELETE - Revoke a token
export async function DELETE(request: Request) {
  const url = new URL(request.url)
  const tokenId = url.searchParams.get('token_id')
  const slackUserId = url.searchParams.get('slack_user_id')
  
  if (!tokenId || !slackUserId) {
    return NextResponse.json(
      { error: 'token_id and slack_user_id are required' },
      { status: 400 }
    )
  }
  
  const supabase = createAdminClient()
  
  // Verify ownership before deletion
  const { data: token } = await supabase
    .from('agent_tokens')
    .select('id')
    .eq('id', tokenId)
    .eq('slack_user_id', slackUserId)
    .single()
  
  if (!token) {
    return NextResponse.json(
      { error: 'Token not found or not owned by user' },
      { status: 404 }
    )
  }
  
  // Soft delete by marking inactive
  const { error } = await supabase
    .from('agent_tokens')
    .update({ is_active: false })
    .eq('id', tokenId)
  
  if (error) {
    return NextResponse.json(
      { error: 'Failed to revoke token' },
      { status: 500 }
    )
  }
  
  return NextResponse.json({ success: true, message: 'Token revoked' })
}
