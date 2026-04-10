import { exec } from 'child_process'
import { promisify } from 'util'
import os from 'os'
import type { DeviceScanResult, OSType } from '../types.js'

const execAsync = promisify(exec)

export async function runCommand(cmd: string, timeout = 10000): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { timeout })
    return stdout.trim()
  } catch {
    return ''
  }
}

export async function runCommandWithError(cmd: string, timeout = 10000): Promise<{ stdout: string; stderr: string; error?: Error }> {
  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout })
    return { stdout: stdout.trim(), stderr: stderr.trim() }
  } catch (error) {
    return { stdout: '', stderr: '', error: error as Error }
  }
}

export function detectOS(): OSType {
  const platform = os.platform()
  if (platform === 'darwin') return 'macos'
  if (platform === 'win32') return 'windows'
  return 'linux'
}

export async function collectBaseInfo(): Promise<Partial<DeviceScanResult>> {
  const cpus = os.cpus()
  const totalMem = os.totalmem()
  
  return {
    hostname: os.hostname(),
    os_type: detectOS(),
    cpu_model: cpus[0]?.model || 'Unknown',
    cpu_cores: cpus.length,
    ram_total_gb: Math.round((totalMem / (1024 ** 3)) * 10) / 10,
  }
}

// Check internet connectivity
export async function checkConnectivity(): Promise<Partial<DeviceScanResult>> {
  const result: Partial<DeviceScanResult> = {
    internet_connected: false,
  }
  
  try {
    // Try to resolve DNS
    const dns = await import('dns')
    const { promisify } = await import('util')
    const resolve = promisify(dns.resolve)
    await resolve('google.com')
    result.internet_connected = true
  } catch {
    result.internet_connected = false
  }
  
  return result
}

// Ping a host and return latency in ms
export async function pingHost(host: string): Promise<number | undefined> {
  const osType = detectOS()
  
  try {
    let cmd: string
    if (osType === 'windows') {
      cmd = `ping -n 1 ${host}`
    } else {
      cmd = `ping -c 1 -W 5 ${host}`
    }
    
    const output = await runCommand(cmd, 10000)
    
    // Parse ping output for latency
    const match = output.match(/time[=<](\d+\.?\d*)\s*ms/i)
    if (match) {
      return parseFloat(match[1])
    }
  } catch {
    // Ping failed
  }
  
  return undefined
}

export async function collectNetworkDiagnostics(): Promise<Partial<DeviceScanResult>> {
  const [pingGoogle, pingCloudflare] = await Promise.all([
    pingHost('8.8.8.8'),
    pingHost('1.1.1.1'),
  ])
  
  return {
    ping_google_ms: pingGoogle,
    ping_cloudflare_ms: pingCloudflare,
  }
}
