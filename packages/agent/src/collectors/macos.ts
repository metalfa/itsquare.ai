import { runCommand } from './base.js'
import type { DeviceScanResult } from '../types.js'

export async function collectMacOSInfo(): Promise<Partial<DeviceScanResult>> {
  const results: Partial<DeviceScanResult> = {
    os_type: 'macos',
  }
  
  // Get macOS version
  try {
    const version = await runCommand('sw_vers -productVersion')
    results.os_version = version
    
    const build = await runCommand('sw_vers -buildVersion')
    results.os_build = build
  } catch {
    // Ignore
  }
  
  // Check firewall status
  try {
    const firewall = await runCommand('/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate')
    results.firewall_enabled = firewall.toLowerCase().includes('enabled')
  } catch {
    // Try alternative method
    try {
      const defaults = await runCommand('defaults read /Library/Preferences/com.apple.alf globalstate')
      results.firewall_enabled = defaults.trim() !== '0'
    } catch {
      // Cannot determine
    }
  }
  
  // Check FileVault status
  try {
    const fv = await runCommand('fdesetup status')
    results.filevault_enabled = fv.toLowerCase().includes('on')
  } catch {
    // May need sudo, try alternative
    try {
      const diskutil = await runCommand('diskutil apfs list')
      results.filevault_enabled = diskutil.toLowerCase().includes('encrypted')
    } catch {
      // Cannot determine
    }
  }
  
  // Check Gatekeeper status
  try {
    const gk = await runCommand('spctl --status')
    results.gatekeeper_enabled = gk.toLowerCase().includes('enabled')
  } catch {
    // Cannot determine
  }
  
  // Check System Integrity Protection
  try {
    const sip = await runCommand('csrutil status')
    results.sip_enabled = sip.toLowerCase().includes('enabled')
  } catch {
    // Cannot determine
  }
  
  // Check for software updates
  try {
    // This can take a while, so we use a longer timeout
    const updates = await runCommand('softwareupdate -l 2>&1', 30000)
    if (updates.includes('No new software available')) {
      results.os_up_to_date = true
      results.pending_updates = 0
    } else {
      // Count updates
      const updateLines = updates.split('\n').filter(line => 
        line.includes('*') || line.includes('Label:')
      )
      results.pending_updates = updateLines.length
      results.os_up_to_date = updateLines.length === 0
    }
  } catch {
    // Cannot determine
  }
  
  // Get disk space
  try {
    const df = await runCommand("df -h / | tail -1 | awk '{print $2, $4}'")
    const parts = df.split(/\s+/)
    if (parts.length >= 2) {
      const parseSize = (s: string): number => {
        const num = parseFloat(s)
        if (s.includes('T')) return num * 1024
        if (s.includes('G')) return num
        if (s.includes('M')) return num / 1024
        return num
      }
      results.disk_total_gb = Math.round(parseSize(parts[0]) * 10) / 10
      results.disk_free_gb = Math.round(parseSize(parts[1]) * 10) / 10
    }
  } catch {
    // Cannot determine
  }
  
  // Check for antivirus (common macOS AV solutions)
  try {
    const apps = await runCommand('ls /Applications')
    const avApps = [
      { name: 'Malwarebytes', folder: 'Malwarebytes' },
      { name: 'Norton', folder: 'Norton' },
      { name: 'Avast', folder: 'Avast' },
      { name: 'Sophos', folder: 'Sophos' },
      { name: 'Bitdefender', folder: 'Bitdefender' },
      { name: 'Kaspersky', folder: 'Kaspersky' },
      { name: 'ESET', folder: 'ESET' },
      { name: 'CrowdStrike', folder: 'Falcon' },
      { name: 'SentinelOne', folder: 'SentinelOne' },
    ]
    
    for (const av of avApps) {
      if (apps.toLowerCase().includes(av.folder.toLowerCase())) {
        results.antivirus_installed = true
        results.antivirus_name = av.name
        break
      }
    }
    
    // macOS has built-in XProtect
    if (!results.antivirus_installed) {
      const xprotect = await runCommand('defaults read /Library/Apple\\ Computer/XProtect/Resources/XProtect.plist 2>/dev/null || echo ""')
      if (xprotect) {
        results.antivirus_installed = true
        results.antivirus_name = 'XProtect (built-in)'
      }
    }
  } catch {
    // Cannot determine
  }
  
  // Check Wi-Fi security
  try {
    const wifi = await runCommand("/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | grep -i 'link auth'")
    if (wifi) {
      const security = wifi.split(':')[1]?.trim()
      results.wifi_security_type = security || 'Unknown'
    }
  } catch {
    // Not connected to Wi-Fi or cannot determine
  }
  
  // Check VPN connection
  try {
    const scutil = await runCommand('scutil --nc list')
    const ifconfig = await runCommand('ifconfig | grep -E "utun|ppp"')
    results.vpn_connected = scutil.toLowerCase().includes('connected') || ifconfig.length > 0
  } catch {
    results.vpn_connected = false
  }
  
  return results
}
