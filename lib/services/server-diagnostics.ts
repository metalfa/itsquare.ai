/**
 * Server-Side Diagnostics — runs from the server, no user machine access needed.
 *
 * For network issues: DNS resolution, HTTP latency, connectivity checks.
 * These run instantly on the Vercel serverless function itself.
 *
 * For device issues: triggers a one-click web diagnostic (user clicks a link,
 * browser JS collects device info, sends back automatically).
 */

import dns from 'dns'
import { promisify } from 'util'
import { interpretDiagnosticResults } from './auto-diagnostic'

const dnsResolve = promisify(dns.resolve)
const dnsResolve4 = promisify(dns.resolve4)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ServerDiagResult {
  check: string
  status: 'ok' | 'warning' | 'error'
  value: string
  detail?: string
}

// ---------------------------------------------------------------------------
// Network Diagnostics (run server-side)
// ---------------------------------------------------------------------------

/**
 * Run a full network diagnostic suite from the server.
 * Tests DNS, HTTP latency, and connectivity to common services.
 */
export async function runNetworkDiagnostics(): Promise<{
  results: ServerDiagResult[]
  interpretation: string
}> {
  const results: ServerDiagResult[] = []

  // 1. DNS Resolution
  const dnsResult = await checkDNS('google.com')
  results.push(dnsResult)

  // 2. DNS for common enterprise services
  const o365 = await checkDNS('outlook.office365.com')
  results.push(o365)

  const slack = await checkDNS('slack.com')
  results.push(slack)

  // 3. HTTP Latency to Google
  const googleLatency = await checkHTTPLatency('https://www.google.com')
  results.push(googleLatency)

  // 4. HTTP Latency to Cloudflare (different CDN)
  const cfLatency = await checkHTTPLatency('https://1.1.1.1')
  results.push(cfLatency)

  // 5. HTTP Latency to Slack API
  const slackLatency = await checkHTTPLatency('https://slack.com/api/api.test')
  results.push(slackLatency)

  // Build fake "command results" for the interpreter
  const commandResults = results.map((r) => ({
    command: r.check,
    stdout: `${r.status.toUpperCase()}: ${r.value}${r.detail ? ` (${r.detail})` : ''}`,
    stderr: '',
    exitCode: r.status === 'error' ? 1 : 0,
  }))

  const interpretation = await interpretDiagnosticResults(
    'network diagnostics — slow wifi/internet',
    commandResults,
  )

  return { results, interpretation }
}

/**
 * Run performance diagnostics using whatever device scan data we have.
 */
export async function runPerformanceDiagFromScan(
  deviceScan: any,
): Promise<string> {
  if (!deviceScan) {
    return "I don't have device data yet. Click the diagnostic link I'm sending to quickly scan your machine — it takes 5 seconds and you don't need to install anything."
  }

  const findings: string[] = []

  // RAM analysis
  if (deviceScan.ram_total_gb && deviceScan.ram_available_gb) {
    const usedPct = Math.round(
      ((deviceScan.ram_total_gb - deviceScan.ram_available_gb) / deviceScan.ram_total_gb) * 100,
    )
    if (usedPct > 85) {
      findings.push(
        `• *RAM is ${usedPct}% full* — only ${deviceScan.ram_available_gb.toFixed(1)}GB free out of ${deviceScan.ram_total_gb.toFixed(1)}GB. This is likely causing slowness.`,
      )
    } else {
      findings.push(
        `• *RAM looks OK* — ${usedPct}% used (${deviceScan.ram_available_gb.toFixed(1)}GB free)`,
      )
    }
  }

  // Disk analysis
  if (deviceScan.disk_total_gb && deviceScan.disk_available_gb) {
    const usedPct = Math.round(
      ((deviceScan.disk_total_gb - deviceScan.disk_available_gb) / deviceScan.disk_total_gb) * 100,
    )
    if (usedPct > 85) {
      findings.push(
        `• *Disk is ${usedPct}% full* — only ${deviceScan.disk_available_gb.toFixed(1)}GB free. When disk is this full, everything slows down.`,
      )
    } else if (deviceScan.disk_available_gb < 20) {
      findings.push(
        `• *Disk space is getting low* — ${deviceScan.disk_available_gb.toFixed(1)}GB free`,
      )
    }
  }

  // Uptime analysis
  if (deviceScan.uptime_days) {
    if (deviceScan.uptime_days > 14) {
      findings.push(
        `• *Your machine has been running for ${Math.round(deviceScan.uptime_days)} days* without a restart. Memory leaks build up over time — a restart would help.`,
      )
    }
  }

  // Top processes
  if (deviceScan.top_processes && deviceScan.top_processes.length > 0) {
    const topProc = deviceScan.top_processes[0]
    if (topProc.mem_mb > 1000) {
      findings.push(
        `• *${topProc.name} is using ${topProc.mem_mb}MB of RAM* — that's a lot. Consider closing it or restarting it.`,
      )
    }
  }

  if (findings.length === 0) {
    return "Your system looks generally healthy based on the last scan. The issue might be application-specific. Which app or task is feeling slow?"
  }

  let response = "Here's what I found from your system data:\n\n"
  response += findings.join('\n')
  response += '\n\n*Recommended:*\n'

  // Generate recommendations
  const recs: string[] = []
  if (findings.some((f) => f.includes('RAM'))) {
    recs.push('1. Close browser tabs and apps you\'re not using')
  }
  if (findings.some((f) => f.includes('Disk'))) {
    recs.push(`${recs.length + 1}. Clear some disk space — empty the Trash, delete old downloads`)
  }
  if (findings.some((f) => f.includes('restart'))) {
    recs.push(`${recs.length + 1}. Restart your computer — it\'s been a while`)
  }
  if (recs.length === 0) {
    recs.push('1. Try restarting the specific app that\'s slow')
  }

  response += recs.join('\n')
  response += '\n\nLet me know if that helps!'

  return response
}

// ---------------------------------------------------------------------------
// Individual Checks
// ---------------------------------------------------------------------------

async function checkDNS(hostname: string): Promise<ServerDiagResult> {
  const start = Date.now()
  try {
    const addresses = await dnsResolve4(hostname)
    const ms = Date.now() - start
    return {
      check: `DNS resolve: ${hostname}`,
      status: ms > 500 ? 'warning' : 'ok',
      value: `${ms}ms → ${addresses[0]}`,
      detail: ms > 500 ? 'slow DNS resolution' : undefined,
    }
  } catch (error: any) {
    return {
      check: `DNS resolve: ${hostname}`,
      status: 'error',
      value: `FAILED: ${error.code || error.message}`,
      detail: 'DNS resolution failed — possible DNS or connectivity issue',
    }
  }
}

async function checkHTTPLatency(url: string): Promise<ServerDiagResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)

    const ms = Date.now() - start
    return {
      check: `HTTP latency: ${new URL(url).hostname}`,
      status: ms > 2000 ? 'warning' : ms > 5000 ? 'error' : 'ok',
      value: `${ms}ms (HTTP ${res.status})`,
      detail: ms > 2000 ? 'high latency' : undefined,
    }
  } catch (error: any) {
    const ms = Date.now() - start
    return {
      check: `HTTP latency: ${new URL(url).hostname}`,
      status: 'error',
      value: `FAILED after ${ms}ms: ${error.message?.substring(0, 50)}`,
      detail: 'could not reach server',
    }
  }
}
