/**
 * Web Diagnostic API
 *
 * GET  /api/agent/web-diagnostic?ping=1  → 204 (speed test ping endpoint)
 * POST /api/agent/web-diagnostic         → receives device data from /check/<token> page
 *
 * POST Flow:
 * 1. User clicks diagnostic link in Slack
 * 2. Browser page collects device info (OS, RAM, connection, speed test, CPU benchmark, etc.)
 * 3. Posts here with the token
 * 4. We look up the pending diagnostic request
 * 5. Store the device data
 * 6. Run AI-powered interpretation via GPT-4o-mini
 * 7. Post interpretation + follow-up buttons to Slack (single message)
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptToken } from '@/lib/slack/encryption'
import { AI_MODEL, MAX_OUTPUT_TOKENS } from '@/lib/config/constants'

const SLACK_API = 'https://slack.com/api'

// ---------------------------------------------------------------------------
// GET — speed test ping endpoint
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const ping = request.nextUrl.searchParams.get('ping')
  if (ping) {
    return new NextResponse(null, { status: 204 })
  }
  return NextResponse.json({ status: 'ok', endpoint: '/api/agent/web-diagnostic' })
}

// ---------------------------------------------------------------------------
// POST — receive diagnostic data
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, data } = body

    if (!token || !data) {
      return NextResponse.json({ error: 'token and data required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Look up the diagnostic request by token
    const { data: diagReq, error: lookupErr } = await supabase
      .from('web_diagnostics' as any)
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (lookupErr || !diagReq) {
      return NextResponse.json({ error: 'Invalid or expired diagnostic token' }, { status: 404 })
    }

    const row = diagReq as any

    // Update the diagnostic request with the collected data
    await supabase
      .from('web_diagnostics' as any)
      .update({
        device_data: data,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', row.id)

    // Also upsert device_scans with what we learned from browser
    const osName = detectOS(data.userAgent, data.platform)
    await supabase
      .from('device_scans' as any)
      .upsert(
        {
          workspace_id: row.workspace_id,
          slack_user_id: row.slack_user_id,
          hostname: data.platform || 'unknown',
          os_name: osName,
          os_version: extractOSVersion(data.userAgent),
          ram_total_gb: data.deviceMemory || null,
          ram_available_gb: null,
          disk_total_gb: null,
          disk_available_gb: null,
          uptime_days: null,
          top_processes: null,
          raw_scan: data,
          scanned_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id,slack_user_id' },
      )

    // Get workspace for bot token
    const { data: workspace } = await supabase
      .from('slack_workspaces')
      .select('bot_token_encrypted')
      .eq('id', row.workspace_id)
      .single()

    if (!workspace) {
      return NextResponse.json({ success: true, posted: false })
    }

    const botToken = decryptToken(workspace.bot_token_encrypted)

    // Build AI-powered interpretation
    const interpretation = await generateDiagInterpretation(data, row.issue_type)

    // Single message: interpretation + follow-up buttons
    await fetch(`${SLACK_API}/chat.postMessage`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: row.channel_id,
        thread_ts: row.thread_ts,
        text: interpretation,
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: interpretation },
          },
          { type: 'divider' },
          {
            type: 'actions',
            block_id: `fix_confirm_${row.id}`,
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: '✅ That fixed it!', emoji: true },
                style: 'primary',
                action_id: 'fix_resolved',
                value: row.thread_ts,
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: '😞 Still broken', emoji: true },
                action_id: 'fix_still_broken',
                value: row.thread_ts,
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: '🆘 Connect me with IT', emoji: true },
                action_id: 'fix_escalate',
                value: row.thread_ts,
              },
            ],
          },
        ],
      }),
    })

    return NextResponse.json({ success: true, posted: true })
  } catch (error) {
    console.error('[ITSquare] Web diagnostic error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// AI-powered interpretation
// ---------------------------------------------------------------------------

async function generateDiagInterpretation(data: any, issueType: string): Promise<string> {
  try {
    const dataStr = JSON.stringify(
      {
        os: detectOS(data.userAgent, data.platform),
        osVersion: extractOSVersion(data.userAgent),
        ram: data.deviceMemory ? `${data.deviceMemory}GB` : 'unknown',
        cpuCores: data.hardwareConcurrency || 'unknown',
        cpuBenchmark: data.cpuBenchmarkMs
          ? `${data.cpuBenchmarkMs}ms (score: ${data.cpuScore}/100)`
          : 'not available',
        jsHeap:
          data.jsHeapUsedMB != null
            ? `${data.jsHeapUsedMB}MB used / ${data.jsHeapTotalMB}MB total / ${data.jsHeapLimitMB}MB limit`
            : 'not available',
        speedTest: data.speedTestDownloadMbps != null
          ? `${data.speedTestDownloadMbps} Mbps download, ${data.speedTestLatencyMs}ms latency`
          : 'not available',
        connectionType: data.connectionType || 'unknown',
        navigatorDownlink: data.downlink ? `${data.downlink} Mbps` : 'unknown',
        navigatorRtt: data.rtt ? `${data.rtt}ms` : 'unknown',
        latencyGoogle: data.latencyGoogle ? `${data.latencyGoogle}ms` : 'not tested',
        latencyCloudflare: data.latencyCloudflare ? `${data.latencyCloudflare}ms` : 'not tested',
        latencySlack: data.latencySlack ? `${data.latencySlack}ms` : 'not tested',
        battery:
          data.batteryLevel != null
            ? `${data.batteryLevel}% ${data.batteryCharging ? '(charging)' : '(not charging)'}`
            : 'unknown',
        display: `${data.screenWidth}x${data.screenHeight} @${data.pixelRatio}x`,
        gpu: data.gpuRenderer || 'unknown',
        storage: data.storageTotalMB
          ? `${data.storageUsedMB}MB used of ${data.storageTotalMB}MB browser quota`
          : 'unknown',
      },
      null,
      2,
    )

    const { text } = await generateText({
      model: gateway(AI_MODEL),
      messages: [
        {
          role: 'system',
          content: `You are an IT diagnostic interpreter. Given device scan data and the user's reported issue type, produce a Slack-formatted diagnosis.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
📊 *Here's what I found from your device:*

• *Finding 1 label:* specific value — assessment
• *Finding 2 label:* specific value — assessment
(3-6 findings, focus on what's RELEVANT to the issue type)

🔧 *What to do:*
1. Most impactful action with visual instructions (click X → do Y)
2. Second action if needed
3. Third action if needed

RULES:
- Reference SPECIFIC numbers from the data. "Your download speed is 3.2 Mbps" not "your internet seems slow"
- For network issues: lead with speed test results and latency
- For performance issues: lead with CPU benchmark, RAM, JS heap
- Skip irrelevant metrics (don't mention GPU for a wifi problem)
- Keep it under 15 lines total
- Use Slack mrkdwn (*bold*, \`code\`)
- NEVER mention "browser scan", "JavaScript heap", or technical scan details — translate everything to plain language
- "Your internet download speed" not "speedTestDownloadMbps"
- "Your CPU performance score" not "cpuBenchmarkMs"`,
        },
        {
          role: 'user',
          content: `Issue type: ${issueType}\n\nDevice scan data:\n${dataStr}`,
        },
      ],
      maxTokens: MAX_OUTPUT_TOKENS,
    })

    return text.trim()
  } catch (error) {
    console.error('[ITSquare] AI diagnosis interpretation error:', error)
    // Fallback to basic interpretation
    return buildFallbackInterpretation(data, issueType)
  }
}

// ---------------------------------------------------------------------------
// Fallback interpretation (used if AI call fails)
// ---------------------------------------------------------------------------

function buildFallbackInterpretation(data: any, issueType: string): string {
  const findings: string[] = []

  // OS
  const os = detectOS(data.userAgent, data.platform)
  findings.push(`• *Device:* ${os}`)

  // RAM
  if (data.deviceMemory) {
    if (data.deviceMemory <= 4) {
      findings.push(
        `• *RAM: ${data.deviceMemory}GB* — this is quite low. Performance will suffer with many apps open.`,
      )
    } else {
      findings.push(`• *RAM: ${data.deviceMemory}GB* — should be adequate for normal use`)
    }
  }

  // CPU benchmark
  if (data.cpuScore != null) {
    if (data.cpuScore < 40) {
      findings.push(
        `• *CPU performance: ${data.cpuScore}/100* — your processor is running slowly, which may cause system-wide sluggishness`,
      )
    } else if (data.cpuScore < 70) {
      findings.push(`• *CPU performance: ${data.cpuScore}/100* — moderate performance`)
    } else {
      findings.push(`• *CPU performance: ${data.cpuScore}/100* — good`)
    }
  }

  // Speed test
  if (data.speedTestDownloadMbps != null) {
    if (data.speedTestDownloadMbps < 5) {
      findings.push(
        `• *Internet speed: ${data.speedTestDownloadMbps} Mbps* — very slow. This is likely causing your issues.`,
      )
    } else if (data.speedTestDownloadMbps < 20) {
      findings.push(
        `• *Internet speed: ${data.speedTestDownloadMbps} Mbps* — below average for video calls and downloads`,
      )
    } else {
      findings.push(`• *Internet speed: ${data.speedTestDownloadMbps} Mbps* — good`)
    }
  } else if (data.connectionType) {
    if (data.rtt && data.rtt > 200) {
      findings.push(
        `• *Network: ${data.connectionType}* — latency is ${data.rtt}ms, which is *high*. This would cause slowness.`,
      )
    } else if (data.downlink && data.downlink < 5) {
      findings.push(
        `• *Network: ${data.connectionType}* — bandwidth is ${data.downlink}Mbps, which is *slow*.`,
      )
    } else {
      findings.push(
        `• *Network: ${data.connectionType}* — ${data.downlink ? data.downlink + 'Mbps' : 'speed unknown'}, ${data.rtt ? data.rtt + 'ms latency' : ''}`,
      )
    }
  }

  // Battery
  if (data.batteryLevel !== null && data.batteryLevel < 20 && !data.batteryCharging) {
    findings.push(
      `• *Battery: ${data.batteryLevel}%* — low battery can throttle performance. Plug in your charger!`,
    )
  }

  // Screen
  if (data.screenWidth && data.screenHeight) {
    findings.push(`• *Display: ${data.screenWidth}×${data.screenHeight}*`)
  }

  let response = "📊 *Here's what I found from your device:*\n\n"
  response += findings.join('\n')

  // Recommendations
  response += '\n\n🔧 *Recommended:*\n'

  const recs: string[] = []
  if (data.speedTestDownloadMbps != null && data.speedTestDownloadMbps < 5) {
    recs.push('1. *Move closer to your WiFi router* — your internet speed is very low')
    recs.push('2. *Disconnect and reconnect* to WiFi, or try restarting your router')
  }
  if (data.cpuScore != null && data.cpuScore < 40) {
    recs.push(`${recs.length + 1}. *Restart your device* — this often clears performance issues`)
    recs.push(`${recs.length + 1}. *Close apps running in the background*`)
  }
  if (data.deviceMemory && data.deviceMemory <= 4) {
    recs.push(`${recs.length + 1}. *Close browser tabs* you're not using — each tab eats memory`)
  }
  if (data.rtt && data.rtt > 200) {
    recs.push(`${recs.length + 1}. *Move closer to your WiFi router* — your connection latency is high`)
    recs.push(`${recs.length + 1}. *Disconnect and reconnect* to WiFi`)
  }
  if (data.batteryLevel !== null && data.batteryLevel < 20 && !data.batteryCharging) {
    recs.push(`${recs.length + 1}. *Plug in your charger* — low battery throttles performance`)
  }
  if (recs.length === 0) {
    recs.push('1. *Restart your device* — this often resolves accumulated slowness')
    recs.push('2. *Close unnecessary browser tabs and apps*')
  }

  response += recs.join('\n')
  response += '\n\nLet me know if that helps!'

  return response
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectOS(userAgent: string, platform: string): string {
  const ua = (userAgent || '').toLowerCase()
  if (ua.includes('mac os x') || ua.includes('macintosh')) return 'macOS'
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('linux')) return 'Linux'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS'
  if (ua.includes('chromeos')) return 'ChromeOS'
  return platform || 'Unknown OS'
}

function extractOSVersion(userAgent: string): string {
  const ua = userAgent || ''
  // macOS
  const macMatch = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/)
  if (macMatch) return macMatch[1].replace(/_/g, '.')
  // Windows
  const winMatch = ua.match(/Windows NT (\d+\.\d+)/)
  if (winMatch) {
    const versions: Record<string, string> = {
      '10.0': '10/11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
    }
    return versions[winMatch[1]] || winMatch[1]
  }
  return ''
}
