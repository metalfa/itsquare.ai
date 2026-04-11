/**
 * Device Scanner — collects hardware, OS, and security state.
 * Cross-platform: macOS, Windows, Linux.
 */

import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
import type { DeviceScan, ProcessInfo, Platform } from './types.js'

const execAsync = promisify(exec)
const AGENT_VERSION = '0.1.0'

async function run(cmd: string, timeout = 10000): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { timeout, maxBuffer: 1024 * 100 })
    return stdout.trim()
  } catch {
    return ''
  }
}

function getPlatform(): Platform {
  return os.platform() as Platform
}

/**
 * Run a full device scan. Returns structured data ready to POST to the API.
 */
export async function scanDevice(): Promise<DeviceScan> {
  const platform = getPlatform()
  const totalMem = os.totalmem() / (1024 ** 3)
  const freeMem = os.freemem() / (1024 ** 3)
  const cpus = os.cpus()
  const uptimeSeconds = os.uptime()

  const [diskInfo, topProcs, firewall, encryption, osVersion] = await Promise.all([
    getDiskInfo(platform),
    getTopProcesses(platform),
    getFirewallStatus(platform),
    getDiskEncryption(platform),
    getOSVersion(platform),
  ])

  return {
    hostname: os.hostname(),
    osName: platform === 'darwin' ? 'macOS' : platform === 'win32' ? 'Windows' : 'Linux',
    osVersion: osVersion || `${os.type()} ${os.release()}`,
    cpuModel: cpus[0]?.model || 'Unknown',
    ramTotalGb: Math.round(totalMem * 10) / 10,
    ramAvailableGb: Math.round(freeMem * 10) / 10,
    diskTotalGb: diskInfo.total,
    diskAvailableGb: diskInfo.available,
    uptimeDays: Math.round((uptimeSeconds / 86400) * 10) / 10,
    topProcesses: topProcs,
    firewallEnabled: firewall,
    diskEncrypted: encryption,
    platform,
    agentVersion: AGENT_VERSION,
    scannedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Disk
// ---------------------------------------------------------------------------

async function getDiskInfo(platform: Platform): Promise<{ total: number; available: number }> {
  try {
    if (platform === 'win32') {
      const out = await run('powershell -Command "Get-PSDrive C | Select-Object Used,Free | ConvertTo-Json"')
      if (out) {
        const data = JSON.parse(out)
        const usedGb = (data.Used || 0) / (1024 ** 3)
        const freeGb = (data.Free || 0) / (1024 ** 3)
        return {
          total: Math.round((usedGb + freeGb) * 10) / 10,
          available: Math.round(freeGb * 10) / 10,
        }
      }
    } else {
      const out = await run("df -k / | tail -1 | awk '{print $2, $4}'")
      const [totalK, availK] = out.split(/\s+/).map(Number)
      if (totalK && availK) {
        return {
          total: Math.round((totalK / (1024 * 1024)) * 10) / 10,
          available: Math.round((availK / (1024 * 1024)) * 10) / 10,
        }
      }
    }
  } catch { /* fallthrough */ }

  return { total: 0, available: 0 }
}

// ---------------------------------------------------------------------------
// Processes
// ---------------------------------------------------------------------------

async function getTopProcesses(platform: Platform): Promise<ProcessInfo[]> {
  try {
    if (platform === 'win32') {
      const out = await run(
        'powershell -Command "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 5 Name,CPU,@{N=\'MemMB\';E={[math]::Round($_.WorkingSet64/1MB)}} | ConvertTo-Json"',
      )
      if (out) {
        const procs = JSON.parse(out)
        const arr = Array.isArray(procs) ? procs : [procs]
        return arr.map((p: any) => ({
          name: p.Name || 'unknown',
          cpu_pct: Math.round((p.CPU || 0) * 10) / 10,
          mem_mb: p.MemMB || 0,
        }))
      }
    } else if (platform === 'darwin') {
      const out = await run("ps aux -m | head -6 | tail -5 | awk '{printf \"%s %s %s\\n\", $11, $3, $6}'")
      return parseUnixProcesses(out)
    } else {
      const out = await run("ps aux --sort=-%mem | head -6 | tail -5 | awk '{printf \"%s %s %s\\n\", $11, $3, $6}'")
      return parseUnixProcesses(out)
    }
  } catch { /* fallthrough */ }

  return []
}

function parseUnixProcesses(output: string): ProcessInfo[] {
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.trim().split(/\s+/)
      const name = (parts[0] || 'unknown').split('/').pop() || 'unknown'
      return {
        name,
        cpu_pct: parseFloat(parts[1] || '0') || 0,
        mem_mb: Math.round((parseInt(parts[2] || '0', 10) || 0) / 1024), // RSS in KB → MB
      }
    })
    .slice(0, 5)
}

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

async function getFirewallStatus(platform: Platform): Promise<boolean | null> {
  try {
    if (platform === 'darwin') {
      const out = await run('/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate')
      return out.toLowerCase().includes('enabled')
    } else if (platform === 'win32') {
      const out = await run('powershell -Command "(Get-NetFirewallProfile -Name Domain).Enabled"')
      return out.trim().toLowerCase() === 'true'
    } else {
      const out = await run('sudo ufw status 2>/dev/null || systemctl is-active firewalld 2>/dev/null')
      return out.includes('active') || out.includes('Status: active')
    }
  } catch { return null }
}

async function getDiskEncryption(platform: Platform): Promise<boolean | null> {
  try {
    if (platform === 'darwin') {
      const out = await run('fdesetup status')
      return out.toLowerCase().includes('on')
    } else if (platform === 'win32') {
      const out = await run('powershell -Command "(Get-BitLockerVolume -MountPoint C:).ProtectionStatus"')
      return out.trim() === 'On' || out.trim() === '1'
    } else {
      const out = await run('lsblk -o NAME,FSTYPE | grep crypt')
      return out.length > 0
    }
  } catch { return null }
}

async function getOSVersion(platform: Platform): Promise<string> {
  try {
    if (platform === 'darwin') {
      return await run('sw_vers -productVersion')
    } else if (platform === 'win32') {
      const out = await run('powershell -Command "[System.Environment]::OSVersion.VersionString"')
      return out || 'Windows'
    } else {
      const out = await run('cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d \'"\'')
      return out || `${os.type()} ${os.release()}`
    }
  } catch {
    return `${os.type()} ${os.release()}`
  }
}
