/**
 * Auto-Diagnostic Engine — runs CLI diagnostics silently and interprets results.
 *
 * When a user consents to diagnostics (clicks "Go ahead"), this module:
 * 1. Determines the right commands for their platform
 * 2. Creates an execution request
 * 3. When the CLI agent reports results, feeds them to AI for interpretation
 * 4. Returns a human-friendly diagnosis
 *
 * This also handles the "no CLI agent" case — when the user has device scan
 * data, we can diagnose from that without running any commands.
 */

import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { AI_MODEL, MAX_OUTPUT_TOKENS } from '@/lib/config/constants'

// ---------------------------------------------------------------------------
// Diagnostic Command Sets (platform-aware)
// ---------------------------------------------------------------------------

interface DiagnosticSet {
  name: string
  description: string
  commands: {
    darwin: string[]
    win32: string[]
    linux: string[]
  }
}

export const DIAGNOSTIC_SETS: Record<string, DiagnosticSet> = {
  performance: {
    name: 'System Performance',
    description: 'CPU, RAM, disk, and top processes',
    commands: {
      darwin: [
        'top -l 1 -n 5 -o MEM -stats pid,command,cpu,mem',
        'vm_stat',
        'df -h /',
        'uptime',
      ],
      win32: [
        'powershell -Command "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 Name,@{N=\'CPU\';E={$_.CPU}},@{N=\'MemMB\';E={[math]::Round($_.WorkingSet64/1MB)}} | Format-Table -AutoSize"',
        'powershell -Command "Get-CimInstance Win32_OperatingSystem | Select-Object FreePhysicalMemory,TotalVisibleMemorySize | Format-List"',
        'powershell -Command "Get-PSDrive C | Select-Object Used,Free | Format-List"',
        'powershell -Command "(Get-CimInstance Win32_OperatingSystem).LastBootUpTime"',
      ],
      linux: [
        'ps aux --sort=-%mem | head -11',
        'free -h',
        'df -h /',
        'uptime',
      ],
    },
  },
  network: {
    name: 'Network Diagnostics',
    description: 'Connectivity, DNS, and latency',
    commands: {
      darwin: [
        'ping -c 3 8.8.8.8',
        'ping -c 3 google.com',
        'cat /etc/resolv.conf',
        'networksetup -getinfo Wi-Fi',
      ],
      win32: [
        'ping 8.8.8.8 -n 3',
        'ping google.com -n 3',
        'powershell -Command "Get-DnsClientServerAddress -InterfaceAlias Wi-Fi | Format-List"',
        'powershell -Command "Get-NetIPConfiguration | Format-List"',
      ],
      linux: [
        'ping -c 3 8.8.8.8',
        'ping -c 3 google.com',
        'cat /etc/resolv.conf',
        'ip addr show | grep inet',
      ],
    },
  },
  security: {
    name: 'Security Check',
    description: 'Firewall, encryption, and update status',
    commands: {
      darwin: [
        'fdesetup status',
        '/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate',
        'softwareupdate -l',
        'csrutil status',
      ],
      win32: [
        'powershell -Command "Get-BitLockerVolume C: | Select-Object VolumeStatus,ProtectionStatus | Format-List"',
        'powershell -Command "Get-NetFirewallProfile | Select-Object Name,Enabled | Format-Table"',
        'powershell -Command "Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 3 | Format-Table"',
        'powershell -Command "Get-MpComputerStatus | Select-Object AntivirusEnabled,RealTimeProtectionEnabled | Format-List"',
      ],
      linux: [
        'lsblk -o NAME,FSTYPE,SIZE | head -10',
        'ufw status 2>/dev/null || systemctl is-active firewalld 2>/dev/null || echo "no firewall detected"',
        'apt list --upgradable 2>/dev/null | head -10 || yum check-update 2>/dev/null | head -10',
        'uptime',
      ],
    },
  },
}

// ---------------------------------------------------------------------------
// Detect which diagnostic set to run based on the conversation
// ---------------------------------------------------------------------------

/**
 * Determine which diagnostic set is most relevant for the user's issue.
 */
export async function chooseDiagnosticSet(
  conversationContext: string,
): Promise<string> {
  try {
    const { text } = await generateText({
      model: gateway(AI_MODEL),
      messages: [
        {
          role: 'system',
          content: `Based on this IT support conversation, which diagnostic set should we run? Reply with EXACTLY one word: "performance", "network", or "security". Nothing else.

- performance: slow computer, high CPU, low RAM, disk full, apps crashing, freezing
- network: slow wifi, can't connect, DNS issues, VPN problems, internet down
- security: encryption check, firewall, updates needed, antivirus, compliance`,
        },
        { role: 'user', content: conversationContext },
      ],
      maxOutputTokens: 10,
    })

    const choice = text.trim().toLowerCase()
    if (choice in DIAGNOSTIC_SETS) return choice
    return 'performance' // default
  } catch {
    return 'performance'
  }
}

/**
 * Get the commands for a diagnostic set on a specific platform.
 */
export function getDiagnosticCommands(
  setName: string,
  platform: 'darwin' | 'win32' | 'linux',
): string[] {
  const set = DIAGNOSTIC_SETS[setName]
  if (!set) return DIAGNOSTIC_SETS.performance.commands[platform]
  return set.commands[platform]
}

// ---------------------------------------------------------------------------
// Interpret Results
// ---------------------------------------------------------------------------

/**
 * Take raw command outputs and generate a human-friendly diagnosis.
 */
export async function interpretDiagnosticResults(
  originalIssue: string,
  results: Array<{ command: string; stdout: string; stderr: string; exitCode: number }>,
): Promise<string> {
  const resultsText = results
    .map((r) => {
      const output = r.stdout || r.stderr || '(no output)'
      return `$ ${r.command}\n${output}`
    })
    .join('\n\n')

  try {
    const { text } = await generateText({
      model: gateway(AI_MODEL),
      messages: [
        {
          role: 'system',
          content: `You are a senior IT professional. A user reported: "${originalIssue}". 
You ran diagnostic commands on their machine. Here are the raw outputs.

Interpret these results for a NON-TECHNICAL user. Your response should:
1. Start with "Here's what I found:" 
2. List 2-4 key findings as bullet points with *bold* labels and plain-language explanations
3. Give a "Recommended fix:" section with numbered steps using simple visual instructions (click this → do that)
4. End with "Let me know if that helps!"

Rules:
- NEVER show raw command output to the user
- NEVER mention terminal, CLI, commands, or technical jargon
- Translate everything into plain language
- Be specific: "Chrome is using 1.8GB of RAM" not "high memory usage"
- If nothing looks wrong, say so: "Your system looks healthy. The issue might be..."`,
        },
        { role: 'user', content: resultsText },
      ],
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    })

    return text.trim()
  } catch (error) {
    console.error('[ITSquare] Failed to interpret diagnostics:', error)
    return "I ran the diagnostics but had trouble interpreting the results. Let me connect you with the IT team for a closer look."
  }
}
