import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashToken, decryptToken } from '@/lib/slack/encryption'

// Device scan data structure from CLI agent
interface DeviceScanPayload {
  device_id?: string
  hostname?: string
  os_type?: 'macos' | 'windows' | 'linux'
  os_version?: string
  os_build?: string
  cpu_model?: string
  cpu_cores?: number
  ram_total_gb?: number
  disk_total_gb?: number
  disk_free_gb?: number
  firewall_enabled?: boolean
  filevault_enabled?: boolean
  bitlocker_enabled?: boolean
  gatekeeper_enabled?: boolean
  sip_enabled?: boolean
  secure_boot_enabled?: boolean
  antivirus_installed?: boolean
  antivirus_name?: string
  antivirus_up_to_date?: boolean
  os_up_to_date?: boolean
  pending_updates?: number
  last_update_check?: string
  browser_extensions?: Record<string, unknown>
  installed_apps?: Record<string, unknown>
  wifi_security_type?: string
  vpn_connected?: boolean
  agent_version?: string
  scan_duration_ms?: number
  raw_scan_data?: Record<string, unknown>
}

// Calculate security score based on scan data
function calculateSecurityScore(scan: DeviceScanPayload): number {
  let score = 100
  const deductions: { reason: string; points: number }[] = []
  
  // Firewall check
  if (scan.firewall_enabled === false) {
    deductions.push({ reason: 'Firewall disabled', points: 15 })
  }
  
  // Disk encryption
  if (scan.os_type === 'macos' && scan.filevault_enabled === false) {
    deductions.push({ reason: 'FileVault disabled', points: 20 })
  }
  if (scan.os_type === 'windows' && scan.bitlocker_enabled === false) {
    deductions.push({ reason: 'BitLocker disabled', points: 20 })
  }
  
  // macOS specific
  if (scan.os_type === 'macos') {
    if (scan.gatekeeper_enabled === false) {
      deductions.push({ reason: 'Gatekeeper disabled', points: 10 })
    }
    if (scan.sip_enabled === false) {
      deductions.push({ reason: 'SIP disabled', points: 15 })
    }
  }
  
  // Windows specific
  if (scan.os_type === 'windows') {
    if (scan.secure_boot_enabled === false) {
      deductions.push({ reason: 'Secure Boot disabled', points: 10 })
    }
  }
  
  // Antivirus
  if (scan.antivirus_installed === false) {
    deductions.push({ reason: 'No antivirus installed', points: 15 })
  } else if (scan.antivirus_up_to_date === false) {
    deductions.push({ reason: 'Antivirus out of date', points: 10 })
  }
  
  // OS updates
  if (scan.os_up_to_date === false) {
    deductions.push({ reason: 'OS updates pending', points: 10 })
  }
  if (scan.pending_updates && scan.pending_updates > 5) {
    deductions.push({ reason: 'Many pending updates', points: 5 })
  }
  
  // Apply deductions
  for (const d of deductions) {
    score -= d.points
  }
  
  return Math.max(0, Math.min(100, score))
}

// Generate issues based on scan data
function generateIssues(scan: DeviceScanPayload): Array<{
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  remediation?: string
}> {
  const issues: Array<{
    id: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    category: string
    title: string
    description: string
    remediation?: string
  }> = []
  
  // Firewall
  if (scan.firewall_enabled === false) {
    issues.push({
      id: 'firewall-disabled',
      severity: 'high',
      category: 'Security',
      title: 'Firewall Disabled',
      description: 'Your system firewall is not enabled, leaving your device vulnerable to network attacks.',
      remediation: scan.os_type === 'macos' 
        ? 'Go to System Settings > Network > Firewall and turn it on.'
        : 'Go to Windows Security > Firewall & network protection and enable the firewall.',
    })
  }
  
  // Disk encryption
  if (scan.os_type === 'macos' && scan.filevault_enabled === false) {
    issues.push({
      id: 'filevault-disabled',
      severity: 'critical',
      category: 'Encryption',
      title: 'FileVault Not Enabled',
      description: 'Your disk is not encrypted. If your device is lost or stolen, your data could be compromised.',
      remediation: 'Go to System Settings > Privacy & Security > FileVault and turn it on.',
    })
  }
  
  if (scan.os_type === 'windows' && scan.bitlocker_enabled === false) {
    issues.push({
      id: 'bitlocker-disabled',
      severity: 'critical',
      category: 'Encryption',
      title: 'BitLocker Not Enabled',
      description: 'Your disk is not encrypted. If your device is lost or stolen, your data could be compromised.',
      remediation: 'Go to Settings > Privacy & security > Device encryption and turn it on.',
    })
  }
  
  // macOS specific
  if (scan.os_type === 'macos') {
    if (scan.gatekeeper_enabled === false) {
      issues.push({
        id: 'gatekeeper-disabled',
        severity: 'high',
        category: 'Security',
        title: 'Gatekeeper Disabled',
        description: 'Gatekeeper helps protect your Mac from malware by verifying apps.',
        remediation: 'Run: sudo spctl --master-enable',
      })
    }
    if (scan.sip_enabled === false) {
      issues.push({
        id: 'sip-disabled',
        severity: 'critical',
        category: 'Security',
        title: 'System Integrity Protection Disabled',
        description: 'SIP protects critical system files. Disabling it exposes your system to potential threats.',
        remediation: 'Boot into Recovery Mode and run: csrutil enable',
      })
    }
  }
  
  // Antivirus
  if (scan.antivirus_installed === false) {
    issues.push({
      id: 'no-antivirus',
      severity: 'high',
      category: 'Security',
      title: 'No Antivirus Software',
      description: 'No antivirus software detected on your system.',
      remediation: 'Install a reputable antivirus solution.',
    })
  } else if (scan.antivirus_up_to_date === false) {
    issues.push({
      id: 'antivirus-outdated',
      severity: 'medium',
      category: 'Security',
      title: 'Antivirus Out of Date',
      description: 'Your antivirus definitions are not up to date.',
      remediation: 'Update your antivirus software.',
    })
  }
  
  // OS updates
  if (scan.os_up_to_date === false) {
    issues.push({
      id: 'os-outdated',
      severity: 'medium',
      category: 'Updates',
      title: 'Operating System Updates Available',
      description: 'Your operating system has pending security updates.',
      remediation: 'Install the latest OS updates.',
    })
  }
  
  if (scan.pending_updates && scan.pending_updates > 10) {
    issues.push({
      id: 'many-pending-updates',
      severity: 'medium',
      category: 'Updates',
      title: 'Many Pending Updates',
      description: `You have ${scan.pending_updates} pending updates.`,
      remediation: 'Install all pending updates.',
    })
  }
  
  // Disk space
  if (scan.disk_free_gb && scan.disk_total_gb) {
    const freePercent = (scan.disk_free_gb / scan.disk_total_gb) * 100
    if (freePercent < 10) {
      issues.push({
        id: 'low-disk-space',
        severity: 'medium',
        category: 'Storage',
        title: 'Low Disk Space',
        description: `Only ${scan.disk_free_gb.toFixed(1)}GB free (${freePercent.toFixed(0)}% of disk).`,
        remediation: 'Free up disk space by removing unnecessary files.',
      })
    }
  }
  
  return issues
}

// POST - Submit a device scan
export async function POST(request: Request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    const tokenHash = await hashToken(token)
    
    const supabase = createAdminClient()
    
    // Verify the token
    const { data: agentToken } = await supabase
      .from('agent_tokens')
      .select('id, workspace_id, slack_user_id, is_active, expires_at')
      .eq('token_hash', tokenHash)
      .single()
    
    if (!agentToken) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    if (!agentToken.is_active) {
      return NextResponse.json(
        { error: 'Token has been revoked' },
        { status: 401 }
      )
    }
    
    if (agentToken.expires_at && new Date(agentToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 401 }
      )
    }
    
    // Update last used timestamp
    await supabase
      .from('agent_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', agentToken.id)
    
    // Parse scan data
    const scanData: DeviceScanPayload = await request.json()
    
    // Calculate scores and issues
    const securityScore = calculateSecurityScore(scanData)
    const issues = generateIssues(scanData)
    
    // Calculate compliance score (simplified - could be enhanced)
    const complianceScore = securityScore >= 80 ? 100 : securityScore >= 60 ? 75 : 50
    
    // Overall health score (weighted average)
    const overallHealthScore = Math.round(securityScore * 0.7 + complianceScore * 0.3)
    
    // Count issues by severity
    const issueCounts = {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
    }
    
    // Store the scan
    const { data: scanRecord, error: scanError } = await supabase
      .from('device_scans')
      .insert({
        agent_token_id: agentToken.id,
        slack_user_id: agentToken.slack_user_id,
        workspace_id: agentToken.workspace_id,
        ...scanData,
        security_score: securityScore,
        compliance_score: complianceScore,
        overall_health_score: overallHealthScore,
        issues,
        issue_count_critical: issueCounts.critical,
        issue_count_high: issueCounts.high,
        issue_count_medium: issueCounts.medium,
        issue_count_low: issueCounts.low,
      })
      .select('id, created_at, security_score, overall_health_score')
      .single()
    
    if (scanError) {
      console.error('Failed to store scan:', scanError)
      return NextResponse.json(
        { error: 'Failed to store scan results' },
        { status: 500 }
      )
    }
    
    // Send Slack notification with scan results
    try {
      // Get workspace bot token and user's Slack ID
      const { data: workspace } = await supabase
        .from('slack_workspaces')
        .select('bot_token_encrypted, team_id')
        .eq('id', agentToken.workspace_id)
        .single()
      
      const { data: slackUser } = await supabase
        .from('slack_users')
        .select('slack_user_id')
        .eq('id', agentToken.slack_user_id)
        .single()
      
      if (workspace && slackUser && workspace.bot_token_encrypted) {
        const botToken = decryptToken(workspace.bot_token_encrypted)
        
        // Build Slack message blocks
        const healthEmoji = overallHealthScore >= 75 ? '🟢' : overallHealthScore >= 50 ? '🟡' : '🔴'
        const totalIssues = issues.length
        
        const blocks = [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${healthEmoji} Scan Complete: ${scanData.hostname || 'Your Device'}`,
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Health Score:*\n${overallHealthScore}/100` },
              { type: 'mrkdwn', text: `*Security Score:*\n${securityScore}/100` },
              { type: 'mrkdwn', text: `*Issues Found:*\n${totalIssues === 0 ? '✅ None' : `${totalIssues} issue${totalIssues > 1 ? 's' : ''}`}` },
              { type: 'mrkdwn', text: `*OS:*\n${scanData.os_type || 'Unknown'} ${scanData.os_version || ''}` },
            ],
          },
        ]
        
        if (totalIssues > 0) {
          const issueText = [
            issueCounts.critical > 0 ? `🔴 ${issueCounts.critical} Critical` : '',
            issueCounts.high > 0 ? `🟠 ${issueCounts.high} High` : '',
            issueCounts.medium > 0 ? `🟡 ${issueCounts.medium} Medium` : '',
            issueCounts.low > 0 ? `⚪ ${issueCounts.low} Low` : '',
          ].filter(Boolean).join(' • ')
          
          blocks.push({
            type: 'section',
            text: { type: 'mrkdwn', text: issueText },
          } as any)
        }
        
        blocks.push({
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Full Report', emoji: true },
              action_id: 'view_full_report',
              style: 'primary',
            },
            ...(totalIssues > 0 ? [{
              type: 'button',
              text: { type: 'plain_text', text: 'Fix Issues', emoji: true },
              action_id: 'view_issues',
            }] : []),
          ],
        } as any)
        
        // Send DM to user
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channel: slackUser.slack_user_id,
            blocks,
            text: `Scan complete for ${scanData.hostname || 'your device'}. Health score: ${overallHealthScore}/100`,
          }),
        })
      }
    } catch (notifyError) {
      // Don't fail the scan if notification fails
      console.error('Failed to send Slack notification:', notifyError)
    }
    
    return NextResponse.json({
      success: true,
      scan_id: scanRecord.id,
      security_score: securityScore,
      compliance_score: complianceScore,
      overall_health_score: overallHealthScore,
      issues_count: issues.length,
      issues_by_severity: issueCounts,
      message: 'Scan submitted successfully. Check Slack for your results!',
    })
  } catch (err) {
    console.error('Scan submission error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get latest scan for a token
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    )
  }
  
  const token = authHeader.substring(7)
  const tokenHash = await hashToken(token)
  
  const supabase = createAdminClient()
  
  // Verify the token
  const { data: agentToken } = await supabase
    .from('agent_tokens')
    .select('id, is_active')
    .eq('token_hash', tokenHash)
    .single()
  
  if (!agentToken || !agentToken.is_active) {
    return NextResponse.json(
      { error: 'Invalid or inactive token' },
      { status: 401 }
    )
  }
  
  // Get latest scan
  const { data: scan } = await supabase
    .from('device_scans')
    .select('*')
    .eq('agent_token_id', agentToken.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (!scan) {
    return NextResponse.json(
      { error: 'No scans found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json({ scan })
}
