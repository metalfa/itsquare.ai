import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Google Workspace OAuth 2.0
// Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
  'https://www.googleapis.com/auth/admin.directory.group.readonly',
  'https://www.googleapis.com/auth/admin.directory.device.mobile.readonly',
  'https://www.googleapis.com/auth/admin.reports.audit.readonly',
].join(' ')

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Get user's org
  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.redirect(new URL('/dashboard?error=no_org', request.url))
  }

  if (action === 'connect') {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      return NextResponse.redirect(new URL('/dashboard/integrations?error=not_configured', request.url))
    }

    // Generate state
    const state = Buffer.from(JSON.stringify({
      orgId: profile.org_id,
      nonce: crypto.randomBytes(16).toString('hex'),
    })).toString('base64url')

    const response = NextResponse.redirect(
      `${GOOGLE_AUTH_URL}?` +
      new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        scope: GOOGLE_SCOPES,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/connect/google/callback`,
        state,
        access_type: 'offline', // Get refresh token
        prompt: 'consent', // Force consent to get refresh token
        hd: '*', // Allow any Google Workspace domain
      }).toString()
    )

    // Set state cookie
    response.cookies.set('google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })

    return response
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
