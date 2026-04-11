/**
 * Context Builder — transforms investigation results into AI prompt sections.
 *
 * Takes the raw outputs from investigate() and builds clean, structured
 * context blocks that get appended to the system prompt.
 */

import type { InvestigationContext } from './investigation'

/**
 * Build the full context injection block for the AI system prompt.
 * Returns empty string if no context is available.
 */
export function buildInvestigationPrompt(ctx: InvestigationContext): string {
  const sections: string[] = []

  // Source D: Device scan (check first — most objective data)
  const deviceSection = buildDeviceScanSection(ctx)
  if (deviceSection) sections.push(deviceSection)

  // Source A: User's own history
  const historySection = buildUserHistorySection(ctx)
  if (historySection) sections.push(historySection)

  // Source B: Colleague resolutions
  const colleagueSection = buildColleagueSection(ctx)
  if (colleagueSection) sections.push(colleagueSection)

  // Source C: Knowledge base
  const kbSection = buildKnowledgeBaseSection(ctx)
  if (kbSection) sections.push(kbSection)

  // Pattern alert
  const patternSection = buildPatternAlert(ctx)
  if (patternSection) sections.push(patternSection)

  if (sections.length === 0) return ''

  return `

---
INVESTIGATION CONTEXT (use this to inform your response — synthesize, don't just list):

${sections.join('\n\n')}
---`
}

// ---------------------------------------------------------------------------
// Section Builders
// ---------------------------------------------------------------------------

function buildDeviceScanSection(ctx: InvestigationContext): string | null {
  const scan = ctx.deviceScan
  if (!scan) return null

  const lines: string[] = ['## Device Scan Data']

  if (scan.hostname) lines.push(`- Hostname: ${scan.hostname}`)
  if (scan.osName) lines.push(`- OS: ${scan.osName} ${scan.osVersion || ''}`.trim())

  if (scan.ramTotalGb != null && scan.ramAvailableGb != null) {
    const usedPct = Math.round(((scan.ramTotalGb - scan.ramAvailableGb) / scan.ramTotalGb) * 100)
    lines.push(`- RAM: ${scan.ramAvailableGb.toFixed(1)}GB free of ${scan.ramTotalGb.toFixed(1)}GB (${usedPct}% used)`)
    if (scan.ramAvailableGb < 2) {
      lines.push('  ⚠️ LOW RAM — likely contributing to performance issues')
    }
  }

  if (scan.diskTotalGb != null && scan.diskAvailableGb != null) {
    const usedPct = Math.round(((scan.diskTotalGb - scan.diskAvailableGb) / scan.diskTotalGb) * 100)
    lines.push(`- Disk: ${scan.diskAvailableGb.toFixed(1)}GB free of ${scan.diskTotalGb.toFixed(1)}GB (${usedPct}% used)`)
    if (scan.diskAvailableGb < 10) {
      lines.push('  ⚠️ LOW DISK SPACE — may cause app crashes and slowness')
    }
  }

  if (scan.uptimeDays != null) {
    lines.push(`- Uptime: ${scan.uptimeDays.toFixed(1)} days`)
    if (scan.uptimeDays > 14) {
      lines.push('  ⚠️ HIGH UPTIME — a restart may resolve accumulated issues')
    }
  }

  if (scan.topProcesses && scan.topProcesses.length > 0) {
    const top3 = scan.topProcesses.slice(0, 3)
    lines.push('- Top processes by memory:')
    for (const p of top3) {
      lines.push(`  • ${p.name}: ${p.mem_mb}MB RAM, ${p.cpu_pct}% CPU`)
    }
  }

  const scanDate = new Date(scan.scannedAt)
  const daysAgo = Math.round((Date.now() - scanDate.getTime()) / (1000 * 60 * 60 * 24))
  lines.push(`- Scan date: ${daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}`)

  return lines.join('\n')
}

function buildUserHistorySection(ctx: InvestigationContext): string | null {
  if (ctx.userHistory.length === 0) return null

  const lines: string[] = ['## This User\'s Previous Issues']

  for (const match of ctx.userHistory) {
    const date = new Date(match.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    if (match.status === 'resolved' && match.resolutionSummary) {
      lines.push(`- [${date}] "${match.topic}" — RESOLVED: ${match.resolutionSummary} (confidence: ${Math.round(match.confidence * 100)}%)`)
    } else if (match.status === 'escalated') {
      lines.push(`- [${date}] "${match.topic}" — was escalated to IT team`)
    } else {
      lines.push(`- [${date}] "${match.topic}" — ${match.status}`)
    }
  }

  return lines.join('\n')
}

function buildColleagueSection(ctx: InvestigationContext): string | null {
  if (ctx.colleagueResolutions.length === 0) return null

  const lines: string[] = ['## Colleague Resolutions (similar issues resolved by others)']

  for (const match of ctx.colleagueResolutions) {
    const date = new Date(match.resolvedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    const reliability = match.timesWorked + match.timesFailed > 0
      ? ` — worked ${match.timesWorked}/${match.timesWorked + match.timesFailed} times`
      : ''

    const confidenceWarning = match.confidence < 0.5
      ? ' ⚠️ This fix has been declining in effectiveness recently.'
      : ''

    lines.push(
      `- [${date}] Issue: "${match.topic}" → Fix: ${match.resolutionSummary} (confidence: ${Math.round(match.confidence * 100)}%${reliability})${confidenceWarning}`,
    )
  }

  return lines.join('\n')
}

function buildKnowledgeBaseSection(ctx: InvestigationContext): string | null {
  if (ctx.knowledgeBase.length === 0) return null

  const lines: string[] = ['## Knowledge Base']

  for (let i = 0; i < ctx.knowledgeBase.length; i++) {
    lines.push(`[${i + 1}] ${ctx.knowledgeBase[i].content}`)
  }

  return lines.join('\n\n')
}

function buildPatternAlert(ctx: InvestigationContext): string | null {
  if (!ctx.recentSimilarIssues) return null

  const { totalCount, uniqueUsers } = ctx.recentSimilarIssues

  return `## ⚠️ PATTERN ALERT
${totalCount} similar issues reported by ${uniqueUsers} different users in the last 48 hours.
This may indicate a systemic problem rather than an individual issue.
Mention this to the user — they should know they're not alone, and this is being tracked.`
}
