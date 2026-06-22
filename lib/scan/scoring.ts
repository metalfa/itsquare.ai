// Scoring Engine - Computes security scores from findings

import type { ScanFindings, SecurityScores } from './types'
import type { IdentityUser } from './types'

/**
 * Compute security scores from findings
 * All scores are 0-100, where 100 is best
 */
export function computeScores(
  findings: ScanFindings,
  totalUsers: number
): SecurityScores {
  if (totalUsers === 0) {
    return {
      overall: 100,
      accessHygiene: 100,
      mfaCoverage: 100,
      licenseEfficiency: 100,
      privilege: 100,
    }
  }

  // Access Hygiene Score (dormant + shared accounts)
  // Penalize based on percentage of problematic accounts
  const dormantRate = findings.dormant.length / totalUsers
  const sharedRate = findings.shared.length / totalUsers
  const accessHygiene = Math.max(0, Math.round(100 - (dormantRate * 100) - (sharedRate * 150)))

  // MFA Coverage Score
  // Each user without MFA reduces score
  const mfaRate = findings.noMfa.length / totalUsers
  const mfaCoverage = Math.max(0, Math.round(100 - (mfaRate * 100)))

  // License Efficiency Score
  const unusedRate = findings.unusedLicenses.length / totalUsers
  const licenseEfficiency = Math.max(0, Math.round(100 - (unusedRate * 100)))

  // Privilege Score (over-privileged + external with access)
  const overPrivilegedRate = findings.overPrivileged.length / totalUsers
  const externalRate = findings.external.length / totalUsers
  const privilege = Math.max(0, Math.round(100 - (overPrivilegedRate * 150) - (externalRate * 50)))

  // Overall Score - weighted average with extra penalty for critical findings
  const criticalPenalty = calculateCriticalPenalty(findings)
  const baseOverall = (
    accessHygiene * 0.25 +
    mfaCoverage * 0.30 +  // MFA is weighted highest
    licenseEfficiency * 0.15 +
    privilege * 0.30
  )
  const overall = Math.max(0, Math.round(baseOverall - criticalPenalty))

  return {
    overall,
    accessHygiene,
    mfaCoverage,
    licenseEfficiency,
    privilege,
  }
}

/**
 * Calculate additional penalty for critical findings
 */
function calculateCriticalPenalty(findings: ScanFindings): number {
  let penalty = 0

  // Admin accounts without MFA - critical
  const adminsNoMfa = findings.noMfa.filter(u => u.isAdmin).length
  penalty += adminsNoMfa * 5

  // Dormant admin accounts - critical
  const dormantAdmins = findings.dormant.filter(u => u.isAdmin).length
  penalty += dormantAdmins * 5

  // Shared accounts with admin access
  const sharedAdmins = findings.shared.filter(u => u.isAdmin).length
  penalty += sharedAdmins * 10

  return Math.min(penalty, 30) // Cap at 30 point penalty
}

/**
 * Get score grade (A-F) based on numeric score
 */
export function getScoreGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

/**
 * Get color class for score visualization
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-yellow-500'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

/**
 * Get background color class for score badge
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500/10 text-green-500 border-green-500/30'
  if (score >= 60) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
  if (score >= 40) return 'bg-orange-500/10 text-orange-500 border-orange-500/30'
  return 'bg-red-500/10 text-red-500 border-red-500/30'
}

/**
 * Calculate benchmark percentile based on historical data
 * Returns null if not enough benchmark data exists
 */
export async function calculateBenchmarkPercentile(
  scores: SecurityScores,
  industry: string | null,
  employeeRange: string | null,
  supabase: any
): Promise<{ overall: number; industry: number | null }> {
  // For MVP, use static benchmarks until we have enough real data
  // These are reasonable industry averages
  const staticBenchmarks: Record<string, number> = {
    'technology': 72,
    'healthcare': 65,
    'finance': 78,
    'retail': 58,
    'manufacturing': 55,
    'education': 52,
    'default': 62,
  }

  const industryBenchmark = industry 
    ? staticBenchmarks[industry.toLowerCase()] || staticBenchmarks.default
    : staticBenchmarks.default

  // Calculate percentile (simplified)
  // If your score is higher than benchmark, you're above average
  const overallPercentile = Math.min(99, Math.max(1, 
    50 + Math.round((scores.overall - industryBenchmark) * 1.5)
  ))

  const industryPercentile = industry
    ? Math.min(99, Math.max(1, 50 + Math.round((scores.overall - industryBenchmark) * 2)))
    : null

  return {
    overall: overallPercentile,
    industry: industryPercentile,
  }
}
