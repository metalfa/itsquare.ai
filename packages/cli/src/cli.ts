#!/usr/bin/env node

/**
 * ITSquare CLI Agent
 *
 * Usage:
 *   npx @itsquare/agent setup              — Configure the agent (one-time)
 *   npx @itsquare/agent scan               — Run a device scan + upload
 *   npx @itsquare/agent listen             — Listen for command execution requests
 *   npx @itsquare/agent exec <request-id>  — Execute a specific request
 *   npx @itsquare/agent status             — Check agent configuration
 *
 * The agent runs locally on the employee's machine.
 * It scans hardware/OS state and executes approved diagnostic commands.
 * Results are sent back to ITSquare AI for interpretation.
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import readline from 'readline'
import { scanDevice } from './scanner.js'
import { executeCommands } from './executor.js'
import { uploadScan, pollExecutionRequests, submitResults } from './api.js'
import type { AgentConfig } from './types.js'

const CONFIG_DIR = path.join(os.homedir(), '.itsquare')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')
const VERSION = '0.1.0'

// ---------------------------------------------------------------------------
// CLI Entry
// ---------------------------------------------------------------------------

const command = process.argv[2]

switch (command) {
  case 'setup':
    await runSetup()
    break
  case 'scan':
    await runScan()
    break
  case 'listen':
    await runListen()
    break
  case 'exec':
    await runExec(process.argv[3])
    break
  case 'status':
    showStatus()
    break
  case '--version':
  case '-v':
    console.log(`@itsquare/agent v${VERSION}`)
    break
  default:
    showHelp()
}

// ---------------------------------------------------------------------------
// Setup — one-time configuration
// ---------------------------------------------------------------------------

async function runSetup() {
  console.log('🔧 ITSquare Agent Setup\n')

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve))

  const apiUrl = (await ask('Server URL (default: https://itsquare.ai): ')).trim() || 'https://itsquare.ai'
  const token = (await ask('Workspace token: ')).trim()
  const userId = (await ask('Your Slack user ID (e.g. U0123456789): ')).trim()

  rl.close()

  if (!token || !userId) {
    console.error('❌ Token and Slack user ID are required.')
    process.exit(1)
  }

  const config: AgentConfig = {
    apiUrl: apiUrl.replace(/\/$/, ''),
    workspaceToken: token,
    slackUserId: userId,
  }

  // Save config
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  fs.chmodSync(CONFIG_FILE, 0o600) // Owner read/write only

  console.log(`\n✅ Configuration saved to ${CONFIG_FILE}`)
  console.log('\nNext steps:')
  console.log('  itsquare-agent scan     — Upload your device info')
  console.log('  itsquare-agent listen   — Start listening for diagnostic requests')
}

// ---------------------------------------------------------------------------
// Scan — collect + upload device info
// ---------------------------------------------------------------------------

async function runScan() {
  const config = loadConfig()

  console.log('🔍 Scanning device...\n')
  const scan = await scanDevice()

  console.log(`  Hostname:    ${scan.hostname}`)
  console.log(`  OS:          ${scan.osName} ${scan.osVersion}`)
  console.log(`  CPU:         ${scan.cpuModel}`)
  console.log(`  RAM:         ${scan.ramAvailableGb}GB free / ${scan.ramTotalGb}GB total`)
  console.log(`  Disk:        ${scan.diskAvailableGb}GB free / ${scan.diskTotalGb}GB total`)
  console.log(`  Uptime:      ${scan.uptimeDays} days`)
  console.log(`  Firewall:    ${scan.firewallEnabled === null ? 'unknown' : scan.firewallEnabled ? '✅ enabled' : '❌ disabled'}`)
  console.log(`  Encryption:  ${scan.diskEncrypted === null ? 'unknown' : scan.diskEncrypted ? '✅ enabled' : '❌ disabled'}`)

  if (scan.topProcesses.length > 0) {
    console.log('\n  Top processes by memory:')
    for (const p of scan.topProcesses) {
      console.log(`    ${p.name.padEnd(20)} ${p.mem_mb}MB RAM  ${p.cpu_pct}% CPU`)
    }
  }

  console.log('\n📤 Uploading scan...')
  const result = await uploadScan(config, scan)

  if (result.success) {
    console.log('✅ Scan uploaded. ITSquare will use this data for smarter diagnoses.')
  } else {
    console.error(`❌ Upload failed: ${result.error}`)
    console.log('\n💡 Your scan data has been collected locally. The bot can still help — it just won\'t have hardware context.')
  }
}

// ---------------------------------------------------------------------------
// Listen — poll for execution requests and run them
// ---------------------------------------------------------------------------

async function runListen() {
  const config = loadConfig()

  console.log('👂 Listening for diagnostic requests from ITSquare...')
  console.log('   Press Ctrl+C to stop.\n')

  let consecutiveErrors = 0

  while (true) {
    try {
      const requests = await pollExecutionRequests(config)

      if (requests.length > 0) {
        consecutiveErrors = 0

        for (const req of requests) {
          console.log(`\n📨 Received request: ${req.purpose}`)
          console.log(`   Commands: ${req.commands.length}`)

          // Show commands before executing
          for (const cmd of req.commands) {
            const tierIcon = cmd.tier === 1 ? '🔍' : cmd.tier === 2 ? '🔧' : '⚠️'
            console.log(`   ${tierIcon} ${cmd.command}`)
          }

          console.log('\n   Executing...')
          const results = await executeCommands(req.commands)

          // Show results
          for (const r of results) {
            const icon = r.exitCode === 0 ? '✅' : '❌'
            console.log(`   ${icon} ${r.command}`)
            if (r.stdout) {
              const preview = r.stdout.split('\n').slice(0, 3).join('\n      ')
              console.log(`      ${preview}`)
            }
            if (r.exitCode !== 0 && r.stderr) {
              console.log(`      Error: ${r.stderr.split('\n')[0]}`)
            }
          }

          // Submit results
          console.log('\n   📤 Sending results to ITSquare...')
          const submitResult = await submitResults(config, req.id, results)

          if (submitResult.success) {
            console.log('   ✅ Results sent. ITSquare will interpret them in your Slack thread.')
          } else {
            console.error(`   ❌ Failed to submit: ${submitResult.error}`)
          }
        }
      }

      consecutiveErrors = 0
    } catch (error: any) {
      consecutiveErrors++
      if (consecutiveErrors <= 3) {
        console.error(`⚠️ Poll error: ${error.message}`)
      }
      if (consecutiveErrors >= 10) {
        console.error('❌ Too many consecutive errors. Check your configuration.')
        process.exit(1)
      }
    }

    // Poll every 5 seconds
    await sleep(5000)
  }
}

// ---------------------------------------------------------------------------
// Exec — execute a specific request by ID
// ---------------------------------------------------------------------------

async function runExec(requestId: string | undefined) {
  if (!requestId) {
    console.error('Usage: itsquare-agent exec <request-id>')
    process.exit(1)
  }

  const config = loadConfig()

  console.log(`🔧 Fetching request ${requestId}...`)

  // Fetch the specific request
  const requests = await pollExecutionRequests(config)
  const req = requests.find((r) => r.id === requestId)

  if (!req) {
    console.error(`❌ Request ${requestId} not found or already completed.`)
    process.exit(1)
  }

  console.log(`\n📋 ${req.purpose}`)
  for (const cmd of req.commands) {
    console.log(`   ${cmd.command} — ${cmd.explanation}`)
  }

  console.log('\nExecuting...\n')
  const results = await executeCommands(req.commands)

  for (const r of results) {
    const icon = r.exitCode === 0 ? '✅' : '❌'
    console.log(`${icon} ${r.command}`)
    if (r.stdout) console.log(r.stdout)
    if (r.stderr && r.exitCode !== 0) console.log(`Error: ${r.stderr}`)
    console.log('')
  }

  console.log('📤 Submitting results...')
  const submitResult = await submitResults(config, requestId, results)

  if (submitResult.success) {
    console.log('✅ Done. Check your Slack thread for the analysis.')
  } else {
    console.error(`❌ Submit failed: ${submitResult.error}`)
  }
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

function showStatus() {
  console.log(`@itsquare/agent v${VERSION}\n`)

  if (!fs.existsSync(CONFIG_FILE)) {
    console.log('❌ Not configured. Run: itsquare-agent setup')
    return
  }

  const config = loadConfig()
  console.log(`  Server:     ${config.apiUrl}`)
  console.log(`  User ID:    ${config.slackUserId}`)
  console.log(`  Token:      ${config.workspaceToken.substring(0, 8)}...`)
  console.log(`  Config:     ${CONFIG_FILE}`)
  console.log(`  Platform:   ${process.platform}`)
  console.log('\n✅ Configured')
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function showHelp() {
  console.log(`
ITSquare CLI Agent v${VERSION}
━━━━━━━━━━━━━━━━━━━━━━━━━

Commands:
  setup              Configure the agent (one-time)
  scan               Scan your device and upload to ITSquare
  listen             Listen for diagnostic requests from Slack
  exec <request-id>  Execute a specific diagnostic request
  status             Show configuration status

Examples:
  npx @itsquare/agent setup
  npx @itsquare/agent scan
  npx @itsquare/agent listen

The agent runs on YOUR machine. ITSquare proposes diagnostics
in Slack, you approve them, and this agent executes them locally.
Results are sent back for AI interpretation.
`)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadConfig(): AgentConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('❌ Agent not configured. Run: itsquare-agent setup')
    process.exit(1)
  }

  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
