// Okta API Client - Fetches users, groups, and apps from Okta

import type { IdentityUser } from './types'

interface OktaUser {
  id: string
  status: string
  created: string
  lastLogin: string | null
  profile: {
    email: string
    firstName: string
    lastName: string
    login: string
    userType?: string
  }
  credentials?: {
    provider?: { type: string }
  }
}

interface OktaGroup {
  id: string
  profile: { name: string }
}

interface OktaAppLink {
  id: string
  label: string
  appName: string
}

/**
 * Fetch all users from Okta
 */
export async function fetchOktaUsers(
  domain: string,
  accessToken: string
): Promise<IdentityUser[]> {
  const users: IdentityUser[] = []
  let url = `https://${domain}/api/v1/users?limit=200`
  
  // Paginate through all users
  while (url) {
    const response = await fetch(url, {
      headers: {
        'Authorization': `SSWS ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Okta API error: ${response.status} - ${error}`)
    }

    const oktaUsers: OktaUser[] = await response.json()
    
    // Fetch MFA status and groups for each user (batched for performance)
    const enrichedUsers = await Promise.all(
      oktaUsers.map(u => enrichOktaUser(u, domain, accessToken))
    )
    
    users.push(...enrichedUsers)

    // Check for pagination
    const linkHeader = response.headers.get('link')
    url = parseLinkHeader(linkHeader, 'next') || ''
  }

  return users
}

/**
 * Enrich Okta user with MFA status, groups, and apps
 */
async function enrichOktaUser(
  user: OktaUser,
  domain: string,
  accessToken: string
): Promise<IdentityUser> {
  const headers = {
    'Authorization': `SSWS ${accessToken}`,
    'Accept': 'application/json',
  }

  // Fetch user's factors (MFA)
  let mfaEnabled = false
  try {
    const factorsRes = await fetch(
      `https://${domain}/api/v1/users/${user.id}/factors`,
      { headers }
    )
    if (factorsRes.ok) {
      const factors = await factorsRes.json()
      mfaEnabled = factors.some((f: any) => f.status === 'ACTIVE')
    }
  } catch {
    // Continue without MFA data
  }

  // Fetch user's groups
  let groups: string[] = []
  try {
    const groupsRes = await fetch(
      `https://${domain}/api/v1/users/${user.id}/groups`,
      { headers }
    )
    if (groupsRes.ok) {
      const userGroups: OktaGroup[] = await groupsRes.json()
      groups = userGroups.map(g => g.profile.name)
    }
  } catch {
    // Continue without groups
  }

  // Fetch user's app assignments
  let apps: string[] = []
  try {
    const appsRes = await fetch(
      `https://${domain}/api/v1/users/${user.id}/appLinks`,
      { headers }
    )
    if (appsRes.ok) {
      const appLinks: OktaAppLink[] = await appsRes.json()
      apps = appLinks.map(a => a.label || a.appName)
    }
  } catch {
    // Continue without apps
  }

  // Determine if user is admin
  const isAdmin = groups.some(g => 
    /admin|super|owner/i.test(g)
  )

  // Map user type
  const userType = mapOktaUserType(user.profile.userType)

  return {
    id: user.id,
    email: user.profile.email || user.profile.login,
    displayName: `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() || null,
    status: mapOktaStatus(user.status),
    lastLogin: user.lastLogin,
    created: user.created,
    mfaEnabled,
    isAdmin,
    groups,
    apps,
    source: 'okta',
    userType,
  }
}

/**
 * Map Okta status to our status type
 */
function mapOktaStatus(status: string): IdentityUser['status'] {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'active'
    case 'SUSPENDED':
      return 'suspended'
    case 'DEPROVISIONED':
      return 'deprovisioned'
    case 'STAGED':
    case 'PROVISIONED':
      return 'staged'
    default:
      return 'active'
  }
}

/**
 * Map Okta user type to our type
 */
function mapOktaUserType(type?: string): IdentityUser['userType'] {
  if (!type) return 'employee'
  const lower = type.toLowerCase()
  if (lower.includes('contract')) return 'contractor'
  if (lower.includes('service')) return 'service_account'
  return 'employee'
}

/**
 * Parse Link header for pagination
 */
function parseLinkHeader(header: string | null, rel: string): string | null {
  if (!header) return null
  
  const links = header.split(',')
  for (const link of links) {
    const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/)
    if (match && match[2] === rel) {
      return match[1]
    }
  }
  return null
}
