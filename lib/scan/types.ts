// Scan Engine Types

import type { FindingCategory, FindingSeverity, IntegrationProvider } from '@/lib/types/database'

// Raw user record from identity providers
export interface IdentityUser {
  id: string
  email: string
  displayName: string | null
  status: 'active' | 'suspended' | 'deprovisioned' | 'staged'
  lastLogin: string | null
  created: string
  mfaEnabled: boolean
  isAdmin: boolean
  groups: string[]
  apps: string[]
  source: IntegrationProvider
  userType: 'employee' | 'contractor' | 'service_account' | 'unknown'
  rawData?: Record<string, unknown>
}

// Categorized findings from the rules engine
export interface ScanFindings {
  dormant: IdentityUser[]
  noMfa: IdentityUser[]
  overPrivileged: IdentityUser[]
  shared: IdentityUser[]
  external: IdentityUser[]
  unusedLicenses: IdentityUser[]
  all: FindingRecord[]
}

// Individual finding record for database storage
export interface FindingRecord {
  category: FindingCategory
  severity: FindingSeverity
  user_email: string | null
  user_name: string | null
  detail: Record<string, unknown>
  source: IntegrationProvider
}

// Security scores computed from findings
export interface SecurityScores {
  overall: number
  accessHygiene: number
  mfaCoverage: number
  licenseEfficiency: number
  privilege: number
}

// AI analysis result
export interface AIAnalysis {
  summary: string
  recommendations: {
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    category: FindingCategory
    estimated_impact: string
  }[]
}

// Scan progress event
export interface ScanProgress {
  step: number
  totalSteps: number
  message: string
  percent: number
}
