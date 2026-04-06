// Rules Engine - Analyzes users and detects security issues

import type { FindingCategory, FindingSeverity, IntegrationProvider } from '@/lib/types/database'
import type { IdentityUser, ScanFindings, FindingRecord } from './types'

const DORMANT_THRESHOLD_DAYS = 90
const INACTIVE_WARNING_DAYS = 30

// Shared/generic account patterns
const SHARED_ACCOUNT_PATTERNS = [
  /^(info|admin|support|hello|contact|sales|marketing|hr|finance|it|team|shared|general|office|noreply|no-reply)@/i,
  /^(reception|front.?desk|help.?desk|service|customer)@/i,
]

// Over-privileged indicators
const ADMIN_GROUP_PATTERNS = [
  /admin/i, /super.?user/i, /root/i, /owner/i, /god.?mode/i,
  /global.?admin/i, /domain.?admin/i, /enterprise.?admin/i,
]

/**
 * Main rules engine - analyzes users and categorizes findings
 */
export function analyzeUsers(users: IdentityUser[]): ScanFindings {
  const now = new Date()
  const dormantThreshold = new Date(now.getTime() - DORMANT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000)
  const inactiveThreshold = new Date(now.getTime() - INACTIVE_WARNING_DAYS * 24 * 60 * 60 * 1000)

  // Active users only for most checks
  const activeUsers = users.filter(u => u.status === 'active')

  // 1. Dormant accounts - no login in 90+ days
  const dormant = activeUsers.filter(u => {
    if (!u.lastLogin) return true // Never logged in
    return new Date(u.lastLogin) < dormantThreshold
  })

  // 2. No MFA enabled
  const noMfa = activeUsers.filter(u => !u.mfaEnabled)

  // 3. Over-privileged accounts
  const overPrivileged = activeUsers.filter(u => {
    // Direct admin flag
    if (u.isAdmin) return true
    // In admin groups
    if (u.groups.some(g => ADMIN_GROUP_PATTERNS.some(p => p.test(g)))) return true
    // Too many app assignments (potential over-provisioning)
    if (u.apps.length > 10) return true
    return false
  })

  // 4. Shared/generic accounts
  const shared = activeUsers.filter(u => 
    SHARED_ACCOUNT_PATTERNS.some(pattern => pattern.test(u.email))
  )

  // 5. External/contractor accounts still active
  const external = activeUsers.filter(u => 
    u.userType === 'contractor' || u.userType === 'service_account'
  )

  // 6. Unused licenses - users who never logged in or are suspended but still exist
  const unusedLicenses = users.filter(u => {
    if (u.status === 'suspended' || u.status === 'deprovisioned') return true
    if (!u.lastLogin) return true // Never used the account
    return false
  })

  // Convert to finding records
  const all: FindingRecord[] = [
    ...dormant.map(u => createFinding(u, 'dormant_account', determineSeverity('dormant', u))),
    ...noMfa.map(u => createFinding(u, 'no_mfa', determineSeverity('no_mfa', u))),
    ...overPrivileged.map(u => createFinding(u, 'over_privileged', determineSeverity('over_privileged', u))),
    ...shared.map(u => createFinding(u, 'shared_account', determineSeverity('shared', u))),
    ...external.map(u => createFinding(u, 'external_account', determineSeverity('external', u))),
    ...unusedLicenses.map(u => createFinding(u, 'unused_license', determineSeverity('unused', u))),
  ]

  return {
    dormant,
    noMfa,
    overPrivileged,
    shared,
    external,
    unusedLicenses,
    all,
  }
}

/**
 * Creates a finding record from a user
 */
function createFinding(
  user: IdentityUser,
  category: FindingCategory,
  severity: FindingSeverity
): FindingRecord {
  return {
    category,
    severity,
    user_email: user.email,
    user_name: user.displayName,
    source: user.source,
    detail: {
      status: user.status,
      lastLogin: user.lastLogin,
      mfaEnabled: user.mfaEnabled,
      isAdmin: user.isAdmin,
      groups: user.groups,
      apps: user.apps,
      userType: user.userType,
    },
  }
}

/**
 * Determines severity based on category and user attributes
 */
function determineSeverity(
  category: 'dormant' | 'no_mfa' | 'over_privileged' | 'shared' | 'external' | 'unused',
  user: IdentityUser
): FindingSeverity {
  switch (category) {
    case 'dormant':
      // Dormant admin accounts are critical
      if (user.isAdmin) return 'critical'
      return 'medium'

    case 'no_mfa':
      // No MFA on admin is critical
      if (user.isAdmin) return 'critical'
      return 'high'

    case 'over_privileged':
      // Contractor with admin access is critical
      if (user.userType === 'contractor') return 'critical'
      return 'high'

    case 'shared':
      // Shared accounts with admin access are critical
      if (user.isAdmin) return 'critical'
      return 'high'

    case 'external':
      // External with admin access
      if (user.isAdmin) return 'high'
      return 'medium'

    case 'unused':
      return 'low'

    default:
      return 'info'
  }
}

/**
 * Get human-readable description of a finding category
 */
export function getCategoryDescription(category: FindingCategory): string {
  const descriptions: Record<FindingCategory, string> = {
    dormant_account: 'Account has not been used in 90+ days but remains active',
    no_mfa: 'Account does not have multi-factor authentication enabled',
    over_privileged: 'Account has elevated privileges that may not be necessary',
    shared_account: 'Generic/shared account that may lack proper accountability',
    external_account: 'External contractor or service account with active access',
    unused_license: 'License assigned to suspended or never-used account',
  }
  return descriptions[category]
}
