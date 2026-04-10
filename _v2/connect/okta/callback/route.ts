import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

function encryptToken(token: string): string {
  const key = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32)
  if (!key) throw new Error('Encryption key not configured')
  
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv)
  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const redirectUrl = new URL('/dashboard/integrations', request.url)

  if (error) {
    redirectUrl.searchParams.set('error', error)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code || !state) {
    redirectUrl.searchParams.set('error', 'missing_params')
    return NextResponse.redirect(redirectUrl)
  }

  // Verify state from cookie
  const storedState = request.cookies.get('okta_oauth_state')?.value
  if (!storedState || storedState !== state) {
    redirectUrl.searchParams.set('error', 'state_mismatch')
    return NextResponse.redirect(redirectUrl)
  }

  // Decode state
  let stateData: { orgId: string; domain: string; codeVerifier: string }
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'))
  } catch {
    redirectUrl.searchParams.set('error', 'invalid_state')
    return NextResponse.redirect(redirectUrl)
  }

  const { orgId, domain, codeVerifier } = stateData

  // Exchange code for tokens
  const clientId = process.env.OKTA_CLIENT_ID
  const clientSecret = process.env.OKTA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    redirectUrl.searchParams.set('error', 'not_configured')
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const tokenResponse = await fetch(`https://${domain}/oauth2/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/connect/okta/callback`,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier: codeVerifier,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('[v0] Okta token exchange failed:', errorData)
      redirectUrl.searchParams.set('error', 'token_exchange_failed')
      return NextResponse.redirect(redirectUrl)
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokens

    // Verify the user is still authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirectUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(redirectUrl)
    }

    // Verify user belongs to this org
    const { data: profile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (profile?.org_id !== orgId) {
      redirectUrl.searchParams.set('error', 'org_mismatch')
      return NextResponse.redirect(redirectUrl)
    }

    // Store the integration
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    const { error: upsertError } = await supabase
      .from('integrations')
      .upsert({
        org_id: orgId,
        provider: 'okta',
        access_token_encrypted: encryptToken(access_token),
        refresh_token_encrypted: refresh_token ? encryptToken(refresh_token) : null,
        token_expires_at: expiresAt,
        domain,
        scopes: ['openid', 'profile', 'email'],
        status: 'active',
        connected_at: new Date().toISOString(),
      }, {
        onConflict: 'org_id,provider',
      })

    if (upsertError) {
      console.error('[v0] Failed to store integration:', upsertError)
      redirectUrl.searchParams.set('error', 'storage_failed')
      return NextResponse.redirect(redirectUrl)
    }

    // Clear the state cookie
    const response = NextResponse.redirect(redirectUrl)
    response.cookies.delete('okta_oauth_state')
    redirectUrl.searchParams.set('success', 'okta_connected')

    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error('[v0] Okta callback error:', err)
    redirectUrl.searchParams.set('error', 'unknown')
    return NextResponse.redirect(redirectUrl)
  }
}
