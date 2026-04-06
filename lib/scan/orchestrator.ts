// Scan Orchestrator - Coordinates the entire scan process

import { createClient } from '@/lib/supabase/server'
import type { Integration } from '@/lib/types/database'
import type { IdentityUser, ScanFindings, SecurityScores, AIAnalysis, ScanProgress } from './types'
import { analyzeUsers } from './rules-engine'
import { computeScores, calculateBenchmarkPercentile } from './scoring'
import { fetchOktaUsers } from './okta-client'
import { fetchGoogleUsers, refreshGoogleToken } from './google-client'

// Encryption utilities
function decrypt(encryptedData: string): string {
  // Simple base64 decode for MVP - in production use proper encryption
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY not configured')
  }
  try {
    return Buffer.from(encryptedData, 'base64').toString('utf8')
  } catch {
    return encryptedData
  }
}

export interface ScanResult {
  success: boolean
  scanId: string
  scores?: SecurityScores
  totalUsers?: number
  findingsCount?: number
  error?: string
}

type ProgressCallback = (progress: ScanProgress) => void

/**
 * Main scan orchestrator
 */
export async function runScan(
  orgId: string,
  scanId: string,
  triggeredBy: string | null,
  onProgress?: ProgressCallback
): Promise<ScanResult> {
  const supabase = await createClient()
  
  const reportProgress = (step: number, totalSteps: number, message: string) => {
    const progress: ScanProgress = {
      step,
      totalSteps,
      message,
      percent: Math.round((step / totalSteps) * 100),
    }
    
    onProgress?.(progress)
    
    // Also log to scan_events table
    supabase.from('scan_events').insert({
      scan_id: scanId,
      event_type: 'progress',
      message,
      progress_percent: progress.percent,
    }).then(() => {})
  }

  const totalSteps = 7

  try {
    // Step 1: Update scan status to running
    reportProgress(1, totalSteps, 'Starting security scan...')
    await supabase.from('scans').update({ 
      status: 'running', 
      started_at: new Date().toISOString() 
    }).eq('id', scanId)

    await supabase.from('scan_events').insert({
      scan_id: scanId,
      event_type: 'started',
      message: 'Scan initiated',
    })

    // Step 2: Fetch integrations
    reportProgress(2, totalSteps, 'Fetching integration credentials...')
    const { data: integrations, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'active')

    if (intError || !integrations?.length) {
      throw new Error('No active integrations found. Please connect Okta or Google Workspace first.')
    }

    // Step 3: Pull users from identity providers
    reportProgress(3, totalSteps, 'Fetching users from identity providers...')
    const allUsers: IdentityUser[] = []

    for (const integration of integrations as Integration[]) {
      try {
        const decryptedToken = decrypt(integration.access_token_encrypted)
        
        if (integration.provider === 'okta' && integration.domain) {
          const oktaUsers = await fetchOktaUsers(integration.domain, decryptedToken)
          allUsers.push(...oktaUsers)
        } else if (integration.provider === 'google_workspace') {
          // Check if token needs refresh
          let accessToken = decryptedToken
          if (integration.token_expires_at) {
            const expiresAt = new Date(integration.token_expires_at)
            if (expiresAt < new Date()) {
              // Token expired, refresh it
              const refreshToken = integration.refresh_token_encrypted 
                ? decrypt(integration.refresh_token_encrypted)
                : null
              if (refreshToken) {
                const refreshed = await refreshGoogleToken(refreshToken)
                accessToken = refreshed.accessToken
                // Update token in database
                await supabase.from('integrations').update({
                  access_token_encrypted: Buffer.from(accessToken).toString('base64'),
                  token_expires_at: refreshed.expiresAt.toISOString(),
                }).eq('id', integration.id)
              }
            }
          }
          
          const googleUsers = await fetchGoogleUsers(accessToken, integration.domain || '')
          allUsers.push(...googleUsers)
        }
      } catch (providerError) {
        console.error(`Error fetching from ${integration.provider}:`, providerError)
        // Continue with other integrations
      }
    }

    if (allUsers.length === 0) {
      throw new Error('No users found from connected identity providers.')
    }

    // Step 4: Run rules engine
    reportProgress(4, totalSteps, `Analyzing ${allUsers.length} users for security issues...`)
    const findings = analyzeUsers(allUsers)

    // Step 5: Compute scores
    reportProgress(5, totalSteps, 'Computing security scores...')
    const scores = computeScores(findings, allUsers.length)

    // Step 6: Calculate benchmark percentile
    reportProgress(6, totalSteps, 'Comparing against industry benchmarks...')
    const { data: org } = await supabase
      .from('organizations')
      .select('industry, employee_count_range')
      .eq('id', orgId)
      .single()

    const benchmarks = await calculateBenchmarkPercentile(
      scores,
      org?.industry || null,
      org?.employee_count_range || null,
      supabase
    )

    // Step 7: Store results
    reportProgress(7, totalSteps, 'Saving scan results...')
    
    // Update scan record
    await supabase.from('scans').update({
      status: 'completed',
      total_users: allUsers.length,
      dormant_accounts: findings.dormant.length,
      no_mfa_accounts: findings.noMfa.length,
      over_privileged_accounts: findings.overPrivileged.length,
      shared_accounts: findings.shared.length,
      external_accounts: findings.external.length,
      unused_licenses: findings.unusedLicenses.length,
      overall_score: scores.overall,
      access_hygiene_score: scores.accessHygiene,
      mfa_coverage_score: scores.mfaCoverage,
      license_efficiency_score: scores.licenseEfficiency,
      privilege_score: scores.privilege,
      benchmark_percentile: benchmarks.overall,
      industry_benchmark_percentile: benchmarks.industry,
      completed_at: new Date().toISOString(),
    }).eq('id', scanId)

    // Store individual findings
    if (findings.all.length > 0) {
      const findingsToInsert = findings.all.map(f => ({
        scan_id: scanId,
        ...f,
      }))
      await supabase.from('findings').insert(findingsToInsert)
    }

    // Log completion event
    await supabase.from('scan_events').insert({
      scan_id: scanId,
      event_type: 'completed',
      message: `Scan completed. Score: ${scores.overall}/100. Found ${findings.all.length} issues.`,
      metadata: { scores, totalUsers: allUsers.length },
    })

    return {
      success: true,
      scanId,
      scores,
      totalUsers: allUsers.length,
      findingsCount: findings.all.length,
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    // Update scan with error
    await supabase.from('scans').update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    }).eq('id', scanId)

    // Log failure event
    await supabase.from('scan_events').insert({
      scan_id: scanId,
      event_type: 'failed',
      message: errorMessage,
    })

    return {
      success: false,
      scanId,
      error: errorMessage,
    }
  }
}
