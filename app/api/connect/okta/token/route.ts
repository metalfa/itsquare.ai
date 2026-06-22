import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple encryption for storing tokens (in production, use a proper encryption library)
function encrypt(text: string): string {
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
  // Simple base64 encoding for now - in production use proper encryption
  return Buffer.from(`${key}:${text}`).toString('base64')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org
    const { data: profile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const { domain, apiToken } = await request.json()

    if (!domain || !apiToken) {
      return NextResponse.json({ error: 'Domain and API token are required' }, { status: 400 })
    }

    // Clean the domain (remove https:// if present)
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')

    // Test the API token by making a simple API call from the server
    const testResponse = await fetch(`https://${cleanDomain}/api/v1/users?limit=1`, {
      headers: {
        'Authorization': `SSWS ${apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('[v0] Okta API test failed:', testResponse.status, errorText)
      return NextResponse.json({ 
        error: `Invalid API token or domain. Okta returned: ${testResponse.status}` 
      }, { status: 400 })
    }

    // Get user count for verification
    const users = await testResponse.json()
    console.log(`[v0] Okta API test successful, found ${Array.isArray(users) ? users.length : 0} users`)

    // Encrypt the token
    const encryptedToken = encrypt(apiToken)

    // Store the integration
    const { error: upsertError } = await supabase.from('integrations').upsert({
      org_id: profile.org_id,
      provider: 'okta',
      domain: cleanDomain,
      access_token_encrypted: encryptedToken,
      scopes: ['okta.users.read', 'okta.groups.read', 'okta.apps.read'],
      status: 'active',
      connected_at: new Date().toISOString(),
    }, {
      onConflict: 'org_id,provider'
    })

    if (upsertError) {
      console.error('[v0] Failed to save integration:', upsertError)
      return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Okta connected successfully',
      userCount: Array.isArray(users) ? users.length : 0
    })

  } catch (error) {
    console.error('[v0] Okta connection error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to connect to Okta' 
    }, { status: 500 })
  }
}
