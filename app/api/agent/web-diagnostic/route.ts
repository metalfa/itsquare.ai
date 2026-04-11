/**
 * Web Diagnostic API
 *
 * POST /api/agent/web-diagnostic
 * Receives device data from the one-click /check/<token> page.
 *
 * Flow:
 * 1. User clicks diagnostic link in Slack
 * 2. Browser page collects device info (OS, RAM, connection, etc.)
 * 3. Posts here with the token
 * 4. We look up the pending diagnostic request
 * 5. Store the device data
 * 6. Run server-side diagnostics
 * 7. Post interpretation to Slack
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptToken } from '@/lib/slack/encryption'
import { runNetworkDiagnostics, runPerformanceDiagFromScan } from '@/lib/services/server-diagnostics'

const SLACK_API = 'https://slack.com/api'

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
          ram_available_gb: null, // browser can't know this
          disk_total_gb: data.storageTotalMB ? Math.round(data.storageTotalMB / 1024) : null,
          disk_available_gb: data.storageTotalMB && data.storageUsedMB
            ? Math.round((data.storageTotalMB - data.storageUsedMB) / 1024) : null,
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

    // Build and post the interpretation
    const interpretation = buildWebDiagInterpretation(data, row.issue_type)

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
      }),
    })

    // Post follow-up buttons
    await fetch(`${SLACK_API}/chat.postMessage`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: row.channel_id,
        thread_ts: row.thread_ts,
        text: 'Did that help?',
        blocks: [
          {
            type: 'actions',
            block_id: `fix_confirm_${row.thread_ts}`,
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
// Interpretation
// ---------------------------------------------------------------------------

function buildWebDiagInterpretation(data: any, issueType: string): string {
  const findings: string[] = []

  // OS
  const os = detectOS(data.userAgent, data.platform)
  findings.push(`• *Device:* ${os}`)

  // RAM
  if (data.deviceMemory) {
    if (data.deviceMemory <= 4) {
      findings.push(`• *RAM: ${data.deviceMemory}GB* — this is quite low. Performance will suffer with many apps open.`)
    } else {
      findings.push(`• *RAM: ${data.deviceMemory}GB* — should be adequate for normal use`)
    }
  }

  // CPU cores
  if (data.hardwareConcurrency) {
    findings.push(`• *CPU cores: ${data.hardwareConcurrency}*`)
  }

  // Connection
  if (data.connectionType) {
    if (data.rtt && data.rtt > 200) {
      findings.push(`• *Network: ${data.connectionType}* — latency is ${data.rtt}ms, which is *high*. This would cause slowness.`)
    } else if (data.downlink && data.downlink < 5) {
      findings.push(`• *Network: ${data.connectionType}* — bandwidth is ${data.downlink}Mbps, which is *slow*.`)
    } else {
      findings.push(`• *Network: ${data.connectionType}* — ${data.downlink ? data.downlink + 'Mbps' : 'speed unknown'}, ${data.rtt ? data.rtt + 'ms latency' : ''}`)
    }
  }

  // Battery
  if (data.batteryLevel !== null) {
    if (data.batteryLevel < 20 && !data.batteryCharging) {
      findings.push(`• *Battery: ${data.batteryLevel}%* — low battery can throttle performance. Plug in your charger!`)
    }
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
  if (data.deviceMemory && data.deviceMemory <= 4) {
    recs.push('1. *Close browser tabs* you\'re not using — each tab eats memory')
    recs.push('2. *Quit apps* running in the background')
  }
  if (data.rtt && data.rtt > 200) {
    recs.push(`${recs.length + 1}. *Move closer to your WiFi router* — your connection latency is high`)
    recs.push(`${recs.length + 1}. *Disconnect and reconnect* to WiFi`)
  }
  if (data.downlink && data.downlink < 5) {
    recs.push(`${recs.length + 1}. *Check if others are streaming* — your bandwidth is limited`)
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
      '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7',
    }
    return versions[winMatch[1]] || winMatch[1]
  }
  return ''
}
