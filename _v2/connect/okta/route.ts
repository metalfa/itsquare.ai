import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Okta OAuth 2.0 with PKCE
// Required env vars: OKTA_CLIENT_ID, OKTA_CLIENT_SECRET

// For Okta OAuth, we use basic OIDC scopes for authentication
// The actual user/group data will be fetched using Okta Admin API with an API token
const OKTA_SCOPES = [
  'openid',
  'profile',
  'email',
].join(' ')

// Generate PKCE code verifier and challenge
function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  return { codeVerifier, codeChallenge }
}

// Simple encryption for tokens (use a proper solution like @vercel/kv in production)
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
  const action = searchParams.get('action')
  const domain = searchParams.get('domain') // Okta domain, e.g., "company.okta.com"

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
    // Initiate OAuth flow
    if (!domain) {
      return NextResponse.redirect(new URL('/dashboard/integrations?error=domain_required', request.url))
    }

    const clientId = process.env.OKTA_CLIENT_ID
    if (!clientId) {
      return NextResponse.redirect(new URL('/dashboard/integrations?error=not_configured', request.url))
    }

    // Generate PKCE
    const { codeVerifier, codeChallenge } = generatePKCE()

    // Generate state with org_id and code_verifier
    const state = Buffer.from(JSON.stringify({
      orgId: profile.org_id,
      domain,
      codeVerifier,
      nonce: crypto.randomBytes(16).toString('hex'),
    })).toString('base64url')

    // Store state in a cookie for verification
    const response = NextResponse.redirect(
      `https://${domain}/oauth2/v1/authorize?` +
      new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        scope: OKTA_SCOPES,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/connect/okta/callback`,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      }).toString()
    )

    // Set state cookie
    response.cookies.set('okta_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })

    return response
  }

  // Default: show integration status
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
