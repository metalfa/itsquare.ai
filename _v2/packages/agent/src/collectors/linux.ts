import { runCommand } from './base.js'
import type { DeviceScanResult } from '../types.js'

export async function collectLinuxInfo(): Promise<Partial<DeviceScanResult>> {
  const results: Partial<DeviceScanResult> = {
    os_type: 'linux',
  }
  
  // Get Linux distribution and version
  try {
    const osRelease = await runCommand('cat /etc/os-release 2>/dev/null || cat /etc/lsb-release 2>/dev/null')
    const nameMatch = osRelease.match(/^PRETTY_NAME="?([^"]+)"?/m) || osRelease.match(/^DISTRIB_DESCRIPTION="?([^"]+)"?/m)
    const versionMatch = osRelease.match(/^VERSION_ID="?([^"]+)"?/m) || osRelease.match(/^DISTRIB_RELEASE="?([^"]+)"?/m)
    
    if (nameMatch) results.os_version = nameMatch[1]
    if (versionMatch) results.os_build = versionMatch[1]
  } catch {
    try {
      const uname = await runCommand('uname -r')
      results.os_version = `Linux ${uname}`
    } catch {
      // Cannot determine
    }
  }
  
  // Check firewall status (ufw or firewalld)
  try {
    const ufw = await runCommand('sudo ufw status 2>/dev/null || ufw status 2>/dev/null')
    if (ufw.toLowerCase().includes('active')) {
      results.firewall_enabled = true
    } else {
      // Try firewalld
      const firewalld = await runCommand('sudo firewall-cmd --state 2>/dev/null || firewall-cmd --state 2>/dev/null')
      results.firewall_enabled = firewalld.toLowerCase().includes('running')
    }
  } catch {
    // Try iptables
    try {
      const iptables = await runCommand('sudo iptables -L 2>/dev/null | head -5')
      results.firewall_enabled = iptables.includes('Chain')
    } catch {
      // Cannot determine
    }
  }
  
  // Check disk encryption (LUKS)
  try {
    const lsblk = await runCommand('lsblk -o NAME,TYPE,FSTYPE 2>/dev/null')
    results.filevault_enabled = lsblk.toLowerCase().includes('crypt')
  } catch {
    // Try dmsetup
    try {
      const dmsetup = await runCommand('sudo dmsetup status 2>/dev/null')
      results.filevault_enabled = dmsetup.toLowerCase().includes('crypt')
    } catch {
      // Cannot determine
    }
  }
  
  // Check for pending updates (apt, dnf, or yum)
  try {
    // Try apt (Debian/Ubuntu)
    let updates = await runCommand('apt list --upgradable 2>/dev/null | grep -c upgradable || echo "0"')
    let count = parseInt(updates.trim(), 10)
    
    if (isNaN(count) || count === 0) {
      // Try dnf (Fedora/RHEL)
      updates = await runCommand('dnf check-update 2>/dev/null | grep -c "^[a-zA-Z]" || echo "0"')
      count = parseInt(updates.trim(), 10)
    }
    
    if (isNaN(count) || count === 0) {
      // Try yum
      updates = await runCommand('yum check-update 2>/dev/null | grep -c "^[a-zA-Z]" || echo "0"')
      count = parseInt(updates.trim(), 10)
    }
    
    results.pending_updates = isNaN(count) ? 0 : count
    results.os_up_to_date = count === 0
  } catch {
    // Cannot determine
  }
  
  // Get disk space
  try {
    const df = await runCommand("df -BG / | tail -1 | awk '{print $2, $4}'")
    const parts = df.split(/\s+/)
    if (parts.length >= 2) {
      results.disk_total_gb = parseFloat(parts[0].replace('G', ''))
      results.disk_free_gb = parseFloat(parts[1].replace('G', ''))
    }
  } catch {
    // Cannot determine
  }
  
  // Check for antivirus (ClamAV is common on Linux)
  try {
    const clamav = await runCommand('which clamscan 2>/dev/null')
    if (clamav) {
      results.antivirus_installed = true
      results.antivirus_name = 'ClamAV'
      
      // Check if freshclam has run recently
      const freshclam = await runCommand('stat /var/lib/clamav/daily.cvd 2>/dev/null | grep Modify')
      if (freshclam) {
        const modDate = new Date(freshclam.split('Modify:')[1]?.trim() || '')
        const daysSinceUpdate = (Date.now() - modDate.getTime()) / (1000 * 60 * 60 * 24)
        results.antivirus_up_to_date = daysSinceUpdate < 7
      }
    }
  } catch {
    results.antivirus_installed = false
  }
  
  // Check for other security tools
  if (!results.antivirus_installed) {
    try {
      const tools = ['sophos', 'crowdstrike', 'sentinelone', 'carbonblack']
      for (const tool of tools) {
        const check = await runCommand(`pgrep -i ${tool} 2>/dev/null || systemctl is-active ${tool} 2>/dev/null`)
        if (check.trim()) {
          results.antivirus_installed = true
          results.antivirus_name = tool.charAt(0).toUpperCase() + tool.slice(1)
          break
        }
      }
    } catch {
      // Cannot determine
    }
  }
  
  // Check VPN connection
  try {
    const vpn = await runCommand('ip link show | grep -E "tun|tap|wg"')
    results.vpn_connected = vpn.trim().length > 0
  } catch {
    results.vpn_connected = false
  }
  
  // Check Wi-Fi security
  try {
    const wifi = await runCommand('nmcli -t -f active,security dev wifi | grep "^yes"')
    if (wifi) {
      const security = wifi.split(':')[1]
      results.wifi_security_type = security || 'Open'
    }
  } catch {
    // Not connected to Wi-Fi or NetworkManager not available
  }
  
  return results
}
