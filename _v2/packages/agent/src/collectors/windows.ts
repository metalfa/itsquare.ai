import { runCommand } from './base.js'
import type { DeviceScanResult } from '../types.js'

export async function collectWindowsInfo(): Promise<Partial<DeviceScanResult>> {
  const results: Partial<DeviceScanResult> = {
    os_type: 'windows',
  }
  
  // Get Windows version
  try {
    const version = await runCommand('powershell -Command "[System.Environment]::OSVersion.Version.ToString()"')
    results.os_version = version
    
    const build = await runCommand('powershell -Command "(Get-ItemProperty \'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\').DisplayVersion"')
    results.os_build = build
  } catch {
    // Try alternative
    try {
      const ver = await runCommand('ver')
      const match = ver.match(/\d+\.\d+\.\d+/)
      if (match) results.os_version = match[0]
    } catch {
      // Cannot determine
    }
  }
  
  // Check Windows Firewall status
  try {
    const firewall = await runCommand('powershell -Command "Get-NetFirewallProfile | Select-Object -ExpandProperty Enabled"')
    results.firewall_enabled = firewall.toLowerCase().includes('true')
  } catch {
    // Try netsh
    try {
      const netsh = await runCommand('netsh advfirewall show allprofiles state')
      results.firewall_enabled = netsh.toLowerCase().includes('on')
    } catch {
      // Cannot determine
    }
  }
  
  // Check BitLocker status
  try {
    const bitlocker = await runCommand('powershell -Command "Get-BitLockerVolume -MountPoint C: | Select-Object -ExpandProperty ProtectionStatus"')
    results.bitlocker_enabled = bitlocker.trim() === '1' || bitlocker.toLowerCase().includes('on')
  } catch {
    // May need admin rights
    try {
      const manage = await runCommand('manage-bde -status C: 2>nul')
      results.bitlocker_enabled = manage.toLowerCase().includes('protection on')
    } catch {
      // Cannot determine
    }
  }
  
  // Check Secure Boot
  try {
    const secureBoot = await runCommand('powershell -Command "Confirm-SecureBootUEFI"')
    results.secure_boot_enabled = secureBoot.toLowerCase().includes('true')
  } catch {
    // May not be UEFI or cannot determine
  }
  
  // Check Windows Update status
  try {
    const updates = await runCommand('powershell -Command "(New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher().Search(\'IsInstalled=0\').Updates.Count"', 30000)
    const count = parseInt(updates.trim(), 10)
    results.pending_updates = isNaN(count) ? undefined : count
    results.os_up_to_date = count === 0
  } catch {
    // Cannot determine
  }
  
  // Get disk space
  try {
    const disk = await runCommand('powershell -Command "Get-PSDrive C | Select-Object @{N=\'Total\';E={[math]::Round($_.Used/1GB + $_.Free/1GB, 1)}}, @{N=\'Free\';E={[math]::Round($_.Free/1GB, 1)}} | ConvertTo-Json"')
    const diskInfo = JSON.parse(disk)
    results.disk_total_gb = diskInfo.Total
    results.disk_free_gb = diskInfo.Free
  } catch {
    // Try WMIC
    try {
      const wmic = await runCommand('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:csv')
      const lines = wmic.trim().split('\n').filter(l => l.includes(','))
      if (lines.length > 0) {
        const parts = lines[lines.length - 1].split(',')
        if (parts.length >= 3) {
          results.disk_free_gb = Math.round(parseInt(parts[1], 10) / (1024 ** 3) * 10) / 10
          results.disk_total_gb = Math.round(parseInt(parts[2], 10) / (1024 ** 3) * 10) / 10
        }
      }
    } catch {
      // Cannot determine
    }
  }
  
  // Check Windows Defender / Antivirus
  try {
    const defender = await runCommand('powershell -Command "Get-MpComputerStatus | Select-Object AntivirusEnabled, RealTimeProtectionEnabled, AntivirusSignatureLastUpdated | ConvertTo-Json"')
    const status = JSON.parse(defender)
    results.antivirus_installed = status.AntivirusEnabled
    results.antivirus_name = 'Windows Defender'
    results.antivirus_up_to_date = status.RealTimeProtectionEnabled
  } catch {
    // Try WMI for third-party antivirus
    try {
      const wmi = await runCommand('powershell -Command "Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct | Select-Object displayName | ConvertTo-Json"')
      const av = JSON.parse(wmi)
      if (av) {
        results.antivirus_installed = true
        results.antivirus_name = Array.isArray(av) ? av[0]?.displayName : av.displayName
      }
    } catch {
      // Cannot determine
    }
  }
  
  // Check VPN connection
  try {
    const vpn = await runCommand('powershell -Command "Get-VpnConnection | Where-Object {$_.ConnectionStatus -eq \'Connected\'} | Select-Object -First 1"')
    results.vpn_connected = vpn.trim().length > 0
  } catch {
    // Check for VPN adapters
    try {
      const adapters = await runCommand('ipconfig | findstr /i "VPN PPP TAP"')
      results.vpn_connected = adapters.trim().length > 0
    } catch {
      results.vpn_connected = false
    }
  }
  
  // Check Wi-Fi security
  try {
    const wifi = await runCommand('netsh wlan show interfaces | findstr /i "Authentication"')
    if (wifi) {
      const match = wifi.match(/:\s*(.+)/)
      results.wifi_security_type = match?.[1]?.trim() || 'Unknown'
    }
  } catch {
    // Not connected to Wi-Fi
  }
  
  return results
}
