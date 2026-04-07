/** @jsxImportSource chat */
import { Card, CardText, Actions, Button, Divider, Fields, Field, Section } from 'chat'
import type { DeviceScan } from './types'

// Get health status emoji and color based on score
function getHealthStatus(score: number | null): { emoji: string; status: string; color: string } {
  if (!score) return { emoji: '⚪', status: 'Unknown', color: 'gray' }
  if (score >= 90) return { emoji: '🟢', status: 'Excellent', color: 'good' }
  if (score >= 75) return { emoji: '🟢', status: 'Good', color: 'good' }
  if (score >= 60) return { emoji: '🟡', status: 'Fair', color: 'warning' }
  if (score >= 40) return { emoji: '🟠', status: 'Needs Attention', color: 'warning' }
  return { emoji: '🔴', status: 'Critical', color: 'danger' }
}

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Format OS info
function formatOS(scan: DeviceScan): string {
  if (!scan.os_type) return 'Unknown'
  const osName = scan.os_type === 'macos' ? 'macOS' : 
                 scan.os_type === 'windows' ? 'Windows' : 'Linux'
  return scan.os_version ? `${osName} ${scan.os_version}` : osName
}

// Create score bar visualization
function createScoreBar(score: number): string {
  const filled = Math.round(score / 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

// Generate issue summary text
function formatIssues(scan: DeviceScan): string {
  const parts: string[] = []
  if (scan.issue_count_critical > 0) parts.push(`🔴 ${scan.issue_count_critical} Critical`)
  if (scan.issue_count_high > 0) parts.push(`🟠 ${scan.issue_count_high} High`)
  if (scan.issue_count_medium > 0) parts.push(`🟡 ${scan.issue_count_medium} Medium`)
  if (scan.issue_count_low > 0) parts.push(`⚪ ${scan.issue_count_low} Low`)
  return parts.length > 0 ? parts.join(' • ') : '✅ No issues found'
}

// Quick summary card (compact)
export function QuickHealthCard({ scan }: { scan: DeviceScan }) {
  const health = getHealthStatus(scan.overall_health_score)
  
  return (
    <Card title={`${health.emoji} ${scan.hostname || 'Your Device'}`}>
      <Fields>
        <Field title="Health">
          {scan.overall_health_score ? `${scan.overall_health_score}/100 ${health.status}` : 'N/A'}
        </Field>
        <Field title="Security">
          {scan.security_score ? `${scan.security_score}/100` : 'N/A'}
        </Field>
      </Fields>
      <CardText>
        {formatIssues(scan)}
      </CardText>
      <CardText>
        _Last scanned {formatRelativeTime(scan.created_at)}_
      </CardText>
    </Card>
  )
}

// Detailed health report card
export function DetailedHealthCard({ scan, aiSummary }: { scan: DeviceScan; aiSummary?: string }) {
  const health = getHealthStatus(scan.overall_health_score)
  const security = getHealthStatus(scan.security_score)
  
  return (
    <Card title={`Device Health Report: ${scan.hostname || 'Unknown'}`}>
      {/* Header with overall score */}
      <Section>
        <CardText>
          *Overall Health: {health.emoji} {scan.overall_health_score || 0}/100 - {health.status}*
        </CardText>
        <CardText>
          `{createScoreBar(scan.overall_health_score || 0)}`
        </CardText>
      </Section>
      
      <Divider />
      
      {/* Score breakdown */}
      <Fields>
        <Field title="🛡️ Security Score">
          {scan.security_score || 0}/100
        </Field>
        <Field title="📋 Compliance">
          {scan.compliance_score || 0}/100
        </Field>
        <Field title="💻 System">
          {formatOS(scan)}
        </Field>
        <Field title="🕐 Scanned">
          {formatRelativeTime(scan.created_at)}
        </Field>
      </Fields>
      
      <Divider />
      
      {/* System Info */}
      <CardText>*System Information*</CardText>
      <Fields>
        <Field title="CPU">
          {scan.cpu_model || 'Unknown'} ({scan.cpu_cores || '?'} cores)
        </Field>
        <Field title="RAM">
          {scan.ram_total_gb ? `${scan.ram_total_gb.toFixed(1)} GB` : 'Unknown'}
        </Field>
        <Field title="Disk">
          {scan.disk_free_gb && scan.disk_total_gb 
            ? `${scan.disk_free_gb.toFixed(0)}/${scan.disk_total_gb.toFixed(0)} GB free`
            : 'Unknown'}
        </Field>
        <Field title="Agent">
          v{scan.agent_version || '?'}
        </Field>
      </Fields>
      
      <Divider />
      
      {/* Security Status */}
      <CardText>*Security Status*</CardText>
      <CardText>
        {scan.firewall_enabled ? '✅' : '❌'} Firewall{'\n'}
        {scan.os_type === 'macos' && (scan.filevault_enabled ? '✅' : '❌')} 
        {scan.os_type === 'macos' && 'FileVault'}
        {scan.os_type === 'windows' && (scan.bitlocker_enabled ? '✅' : '❌')}
        {scan.os_type === 'windows' && 'BitLocker'}
        {scan.os_type === 'linux' && '🔒 Encryption status unknown'}{'\n'}
        {scan.antivirus_installed ? '✅' : '❌'} Antivirus 
        {scan.antivirus_name ? ` (${scan.antivirus_name})` : ''}{'\n'}
        {scan.os_up_to_date ? '✅' : '❌'} OS Up-to-date
        {scan.pending_updates ? ` (${scan.pending_updates} updates pending)` : ''}
      </CardText>
      
      <Divider />
      
      {/* Issues summary */}
      <CardText>*Issues Found*</CardText>
      <CardText>{formatIssues(scan)}</CardText>
      
      {/* AI Summary if available */}
      {aiSummary && (
        <>
          <Divider />
          <CardText>*AI Analysis*</CardText>
          <CardText>{aiSummary}</CardText>
        </>
      )}
      
      <Divider />
      
      <Actions>
        <Button id="view_issues" style="primary">View All Issues</Button>
        <Button id="run_new_scan">Rescan Device</Button>
        <Button id="view_dashboard">Open Dashboard</Button>
      </Actions>
    </Card>
  )
}

// Issues list card
export function IssuesCard({ scan }: { scan: DeviceScan }) {
  const issues = scan.issues as Array<{
    id: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    title: string
    description: string
    remediation?: string
  }> | null
  
  if (!issues || issues.length === 0) {
    return (
      <Card title="✅ No Issues Found">
        <CardText>
          Great job! Your device passed all security checks.
        </CardText>
        <CardText>
          _Keep your device secure by running regular scans._
        </CardText>
      </Card>
    )
  }
  
  const severityEmoji = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '⚪',
  }
  
  // Group by severity
  const critical = issues.filter(i => i.severity === 'critical')
  const high = issues.filter(i => i.severity === 'high')
  const medium = issues.filter(i => i.severity === 'medium')
  const low = issues.filter(i => i.severity === 'low')
  
  const formatIssueGroup = (items: typeof issues, label: string) => {
    if (items.length === 0) return ''
    return `*${label}*\n${items.map(i => 
      `${severityEmoji[i.severity]} *${i.title}*\n   ${i.description}${i.remediation ? `\n   _Fix: ${i.remediation}_` : ''}`
    ).join('\n\n')}`
  }
  
  return (
    <Card title={`Security Issues (${issues.length})`}>
      {critical.length > 0 && (
        <>
          <CardText>{formatIssueGroup(critical, '🔴 Critical Issues')}</CardText>
          <Divider />
        </>
      )}
      {high.length > 0 && (
        <>
          <CardText>{formatIssueGroup(high, '🟠 High Priority')}</CardText>
          <Divider />
        </>
      )}
      {medium.length > 0 && (
        <>
          <CardText>{formatIssueGroup(medium, '🟡 Medium Priority')}</CardText>
          <Divider />
        </>
      )}
      {low.length > 0 && (
        <CardText>{formatIssueGroup(low, '⚪ Low Priority')}</CardText>
      )}
      <Divider />
      <Actions>
        <Button id="get_fix_guide" style="primary">Get Fix Guide</Button>
        <Button id="dismiss_issues">Acknowledge</Button>
      </Actions>
    </Card>
  )
}

// Scan complete notification card (sent after CLI scan)
export function ScanCompleteCard({ scan, aiSummary }: { scan: DeviceScan; aiSummary?: string }) {
  const health = getHealthStatus(scan.overall_health_score)
  const totalIssues = (scan.issue_count_critical || 0) + (scan.issue_count_high || 0) + 
                      (scan.issue_count_medium || 0) + (scan.issue_count_low || 0)
  
  return (
    <Card title={`${health.emoji} Scan Complete: ${scan.hostname || 'Your Device'}`}>
      <CardText>
        Your device scan is complete! Here&apos;s your health summary:
      </CardText>
      
      <Divider />
      
      <Fields>
        <Field title="Health Score">
          {scan.overall_health_score || 0}/100 - {health.status}
        </Field>
        <Field title="Security Score">
          {scan.security_score || 0}/100
        </Field>
        <Field title="Issues Found">
          {totalIssues === 0 ? '✅ None' : `${totalIssues} issue${totalIssues > 1 ? 's' : ''}`}
        </Field>
        <Field title="Scan Time">
          {scan.scan_duration_ms ? `${(scan.scan_duration_ms / 1000).toFixed(1)}s` : 'N/A'}
        </Field>
      </Fields>
      
      {totalIssues > 0 && (
        <>
          <Divider />
          <CardText>{formatIssues(scan)}</CardText>
        </>
      )}
      
      {aiSummary && (
        <>
          <Divider />
          <CardText>*Quick Analysis:* {aiSummary}</CardText>
        </>
      )}
      
      <Divider />
      
      <Actions>
        <Button id="view_full_report" style="primary">View Full Report</Button>
        {totalIssues > 0 && <Button id="view_issues">Fix Issues</Button>}
      </Actions>
    </Card>
  )
}

// Compare with previous scan card
export function ScanComparisonCard({ 
  currentScan, 
  previousScan 
}: { 
  currentScan: DeviceScan
  previousScan: DeviceScan 
}) {
  const currentHealth = currentScan.overall_health_score || 0
  const previousHealth = previousScan.overall_health_score || 0
  const healthDiff = currentHealth - previousHealth
  
  const currentSecurity = currentScan.security_score || 0
  const previousSecurity = previousScan.security_score || 0
  const securityDiff = currentSecurity - previousSecurity
  
  const formatDiff = (diff: number) => {
    if (diff > 0) return `📈 +${diff}`
    if (diff < 0) return `📉 ${diff}`
    return '➡️ No change'
  }
  
  return (
    <Card title="Scan Comparison">
      <CardText>
        Comparing your latest scan with the previous one:
      </CardText>
      
      <Divider />
      
      <Fields>
        <Field title="Health Score">
          {previousHealth} → {currentHealth} ({formatDiff(healthDiff)})
        </Field>
        <Field title="Security Score">
          {previousSecurity} → {currentSecurity} ({formatDiff(securityDiff)})
        </Field>
      </Fields>
      
      <Divider />
      
      <CardText>
        Previous scan: {formatRelativeTime(previousScan.created_at)}{'\n'}
        Current scan: {formatRelativeTime(currentScan.created_at)}
      </CardText>
    </Card>
  )
}

// Fleet overview card (for admins)
export function FleetOverviewCard({ 
  stats 
}: { 
  stats: {
    totalDevices: number
    healthyDevices: number
    atRiskDevices: number
    criticalDevices: number
    avgHealthScore: number
    totalCriticalIssues: number
  }
}) {
  const healthPercentage = stats.totalDevices > 0 
    ? Math.round((stats.healthyDevices / stats.totalDevices) * 100) 
    : 0
  
  return (
    <Card title="Fleet Health Overview">
      <CardText>
        *{stats.totalDevices} Devices* | Avg Health: {stats.avgHealthScore}/100
      </CardText>
      <CardText>
        `{createScoreBar(healthPercentage)}` {healthPercentage}% healthy
      </CardText>
      
      <Divider />
      
      <Fields>
        <Field title="🟢 Healthy">
          {stats.healthyDevices} devices
        </Field>
        <Field title="🟡 At Risk">
          {stats.atRiskDevices} devices
        </Field>
        <Field title="🔴 Critical">
          {stats.criticalDevices} devices
        </Field>
        <Field title="🚨 Total Issues">
          {stats.totalCriticalIssues} critical
        </Field>
      </Fields>
      
      <Divider />
      
      <Actions>
        <Button id="view_fleet_dashboard" style="primary">View Dashboard</Button>
        <Button id="export_report">Export Report</Button>
      </Actions>
    </Card>
  )
}
