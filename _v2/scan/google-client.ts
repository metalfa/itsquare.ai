// Google Workspace Admin API Client - Fetches users and groups

import type { IdentityUser } from './types'

interface GoogleUser {
  id: string
  primaryEmail: string
  name: {
    fullName?: string
    givenName?: string
    familyName?: string
  }
  suspended: boolean
  archived: boolean
  isAdmin: boolean
  isDelegatedAdmin: boolean
  lastLoginTime: string | null
  creationTime: string
  isEnrolledIn2Sv: boolean
  isEnforcedIn2Sv: boolean
  orgUnitPath: string
  customSchemas?: Record<string, any>
}

interface GoogleGroup {
  id: string
  name: string
  email: string
}

/**
 * Fetch all users from Google Workspace
 */
export async function fetchGoogleUsers(
  accessToken: string,
  domain: string
): Promise<IdentityUser[]> {
  const users: IdentityUser[] = []
  let pageToken: string | undefined
  
  do {
    const url = new URL('https://admin.googleapis.com/admin/directory/v1/users')
    url.searchParams.set('customer', 'my_customer')
    url.searchParams.set('maxResults', '500')
    url.searchParams.set('projection', 'full')
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken)
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const googleUsers: GoogleUser[] = data.users || []
    
    // Fetch groups for each user
    const enrichedUsers = await Promise.all(
      googleUsers.map(u => enrichGoogleUser(u, accessToken))
    )
    
    users.push(...enrichedUsers)
    pageToken = data.nextPageToken
  } while (pageToken)

  return users
}

/**
 * Enrich Google user with group memberships
 */
async function enrichGoogleUser(
  user: GoogleUser,
  accessToken: string
): Promise<IdentityUser> {
  // Fetch user's groups
  let groups: string[] = []
  try {
    const url = new URL('https://admin.googleapis.com/admin/directory/v1/groups')
    url.searchParams.set('userKey', user.id)
    
    const groupsRes = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })
    
    if (groupsRes.ok) {
      const data = await groupsRes.json()
      const userGroups: GoogleGroup[] = data.groups || []
      groups = userGroups.map(g => g.name || g.email)
    }
  } catch {
    // Continue without groups
  }

  // Determine user type from org unit or custom attributes
  const userType = determineGoogleUserType(user)

  return {
    id: user.id,
    email: user.primaryEmail,
    displayName: user.name?.fullName || 
      `${user.name?.givenName || ''} ${user.name?.familyName || ''}`.trim() || null,
    status: mapGoogleStatus(user),
    lastLogin: user.lastLoginTime,
    created: user.creationTime,
    mfaEnabled: user.isEnrolledIn2Sv || user.isEnforcedIn2Sv,
    isAdmin: user.isAdmin || user.isDelegatedAdmin,
    groups,
    apps: [], // Google doesn't expose app assignments the same way
    source: 'google_workspace',
    userType,
  }
}

/**
 * Map Google user status
 */
function mapGoogleStatus(user: GoogleUser): IdentityUser['status'] {
  if (user.archived) return 'deprovisioned'
  if (user.suspended) return 'suspended'
  return 'active'
}

/**
 * Determine user type from Google attributes
 */
function determineGoogleUserType(user: GoogleUser): IdentityUser['userType'] {
  // Check org unit path for hints
  const orgPath = user.orgUnitPath?.toLowerCase() || ''
  if (orgPath.includes('contractor') || orgPath.includes('external')) {
    return 'contractor'
  }
  if (orgPath.includes('service') || orgPath.includes('system')) {
    return 'service_account'
  }
  
  // Check custom schemas if available
  if (user.customSchemas) {
    const customValues = JSON.stringify(user.customSchemas).toLowerCase()
    if (customValues.includes('contractor')) return 'contractor'
    if (customValues.includes('service')) return 'service_account'
  }
  
  return 'employee'
}

/**
 * Refresh Google access token
 */
export async function refreshGoogleToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Google token')
  }

  const data = await response.json()
  const expiresAt = new Date(Date.now() + data.expires_in * 1000)
  
  return {
    accessToken: data.access_token,
    expiresAt,
  }
}
