import { generateText } from 'ai'
import type { DeviceScan } from './types'

const MODEL = 'anthropic/claude-sonnet-4-20250514'

// Generate a quick AI summary of the scan results
export async function generateScanSummary(scan: DeviceScan): Promise<string> {
  const issues = scan.issues as Array<{
    severity: string
    title: string
    description: string
  }> | null

  const criticalIssues = issues?.filter(i => i.severity === 'critical') || []
  const highIssues = issues?.filter(i => i.severity === 'high') || []

  const prompt = `You are an IT security assistant. Analyze this device scan and provide a 1-2 sentence summary focusing on the most important finding.

Device: ${scan.hostname || 'Unknown'}
OS: ${scan.os_type} ${scan.os_version || ''}
Health Score: ${scan.overall_health_score}/100
Security Score: ${scan.security_score}/100

Security Status:
- Firewall: ${scan.firewall_enabled ? 'Enabled' : 'Disabled'}
- Disk Encryption: ${scan.filevault_enabled || scan.bitlocker_enabled ? 'Enabled' : 'Disabled'}
- Antivirus: ${scan.antivirus_installed ? `${scan.antivirus_name || 'Installed'}` : 'Not installed'}
- OS Updates: ${scan.os_up_to_date ? 'Up to date' : `${scan.pending_updates || 'Some'} updates pending`}

Critical Issues (${criticalIssues.length}): ${criticalIssues.map(i => i.title).join(', ') || 'None'}
High Priority Issues (${highIssues.length}): ${highIssues.map(i => i.title).join(', ') || 'None'}

Provide a concise, actionable summary. Be direct. If there are critical issues, prioritize them.`

  try {
    const result = await generateText({
      model: MODEL,
      prompt,
      maxOutputTokens: 100,
    })

    return result.text.trim()
  } catch (error) {
    console.error('AI summary generation failed:', error)
    // Fallback to basic summary
    if (criticalIssues.length > 0) {
      return `Critical: ${criticalIssues[0].title}. Address this immediately to protect your device.`
    }
    if (highIssues.length > 0) {
      return `${highIssues.length} high-priority issue(s) found. Review and fix soon.`
    }
    if ((scan.overall_health_score || 0) >= 80) {
      return 'Your device looks healthy! Keep up the good security practices.'
    }
    return 'Some improvements recommended. Check the detailed report for specifics.'
  }
}

// Generate detailed AI recommendations for fixing issues
export async function generateFixRecommendations(
  scan: DeviceScan,
  issueId?: string
): Promise<string> {
  const issues = scan.issues as Array<{
    id: string
    severity: string
    title: string
    description: string
    remediation?: string
  }> | null

  const targetIssues = issueId 
    ? issues?.filter(i => i.id === issueId) 
    : issues?.filter(i => i.severity === 'critical' || i.severity === 'high')

  if (!targetIssues || targetIssues.length === 0) {
    return 'No critical or high-priority issues to address.'
  }

  const prompt = `You are a helpful IT support assistant. Provide step-by-step instructions to fix these security issues.

Device: ${scan.hostname || 'Unknown'} (${scan.os_type} ${scan.os_version || ''})

Issues to fix:
${targetIssues.map(i => `
- ${i.title} (${i.severity})
  ${i.description}
  ${i.remediation ? `Suggested fix: ${i.remediation}` : ''}
`).join('\n')}

Provide clear, numbered steps for each issue. Be specific to the OS. Use simple language.
Keep the response under 500 characters total for Slack readability.`

  try {
    const result = await generateText({
      model: MODEL,
      prompt,
      maxOutputTokens: 300,
    })

    return result.text.trim()
  } catch (error) {
    console.error('AI recommendations failed:', error)
    return targetIssues.map(i => 
      `*${i.title}*: ${i.remediation || 'Check the dashboard for detailed steps.'}`
    ).join('\n')
  }
}

// Generate IT support response based on user query and device context
export async function generateITSupportResponse(
  query: string,
  deviceContext?: DeviceScan | null,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const systemPrompt = `You are ITSquare.AI, a helpful IT support assistant integrated into Slack. You help employees with:
- Device troubleshooting
- Security best practices
- Software questions
- IT policies and procedures

Be concise, friendly, and helpful. Keep responses under 300 words for Slack readability.
If you don't know something specific to their company, suggest they contact their IT team.`

  const deviceInfo = deviceContext ? `
User's Device Context:
- Hostname: ${deviceContext.hostname || 'Unknown'}
- OS: ${deviceContext.os_type} ${deviceContext.os_version || ''}
- Health Score: ${deviceContext.overall_health_score}/100
- Security Score: ${deviceContext.security_score}/100
- Firewall: ${deviceContext.firewall_enabled ? 'On' : 'Off'}
- Disk Encryption: ${deviceContext.filevault_enabled || deviceContext.bitlocker_enabled ? 'On' : 'Off'}
- Pending Updates: ${deviceContext.pending_updates || 0}
` : ''

  const messages = [
    { role: 'system' as const, content: systemPrompt + deviceInfo },
    ...(conversationHistory || []).map(m => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user' as const, content: query },
  ]

  try {
    const result = await generateText({
      model: MODEL,
      messages,
      maxOutputTokens: 400,
    })

    return result.text.trim()
  } catch (error) {
    console.error('IT support response failed:', error)
    return "I'm having trouble processing that right now. Please try again or contact your IT team directly for urgent issues."
  }
}

// Analyze scan trends over time
export async function analyzeScanTrends(
  scans: DeviceScan[]
): Promise<string> {
  if (scans.length < 2) {
    return 'Not enough scan history to analyze trends. Run more scans over time.'
  }

  const latestScan = scans[0]
  const oldestScan = scans[scans.length - 1]
  
  const healthTrend = (latestScan.overall_health_score || 0) - (oldestScan.overall_health_score || 0)
  const securityTrend = (latestScan.security_score || 0) - (oldestScan.security_score || 0)

  const prompt = `Analyze these device scan trends and provide a brief insight.

Scan History (${scans.length} scans):
- Oldest scan: Health ${oldestScan.overall_health_score}/100, Security ${oldestScan.security_score}/100
- Latest scan: Health ${latestScan.overall_health_score}/100, Security ${latestScan.security_score}/100
- Health trend: ${healthTrend > 0 ? '+' : ''}${healthTrend} points
- Security trend: ${securityTrend > 0 ? '+' : ''}${securityTrend} points

Recent issues count:
- Critical: ${latestScan.issue_count_critical || 0}
- High: ${latestScan.issue_count_high || 0}

Provide a 1-2 sentence trend analysis. Be encouraging if improving, actionable if declining.`

  try {
    const result = await generateText({
      model: MODEL,
      prompt,
      maxOutputTokens: 100,
    })

    return result.text.trim()
  } catch (error) {
    console.error('Trend analysis failed:', error)
    if (healthTrend > 0) {
      return `Your device health improved by ${healthTrend} points. Keep up the good work!`
    } else if (healthTrend < 0) {
      return `Your device health decreased by ${Math.abs(healthTrend)} points. Review recent changes.`
    }
    return 'Your device health has been stable.'
  }
}
