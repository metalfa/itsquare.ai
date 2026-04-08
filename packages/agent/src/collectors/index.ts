import { collectBaseInfo, detectOS, checkConnectivity, collectNetworkDiagnostics } from './base.js'
import { collectMacOSInfo } from './macos.js'
import { collectWindowsInfo } from './windows.js'
import { collectLinuxInfo } from './linux.js'
import type { DeviceScanResult } from '../types.js'

export async function collectAllInfo(): Promise<DeviceScanResult> {
  const startTime = Date.now()
  const osType = detectOS()
  
  // Collect base info (cross-platform)
  const baseInfo = await collectBaseInfo()
  
  // Collect OS-specific info
  let osInfo: Partial<DeviceScanResult> = {}
  switch (osType) {
    case 'macos':
      osInfo = await collectMacOSInfo()
      break
    case 'windows':
      osInfo = await collectWindowsInfo()
      break
    case 'linux':
      osInfo = await collectLinuxInfo()
      break
  }
  
  // Collect network diagnostics
  const [connectivity, networkDiag] = await Promise.all([
    checkConnectivity(),
    collectNetworkDiagnostics(),
  ])
  
  const scanDuration = Date.now() - startTime
  
  // Generate a device ID based on hostname and OS
  const deviceId = `${baseInfo.hostname}-${osType}-${Date.now()}`
  
  return {
    ...baseInfo,
    ...osInfo,
    ...connectivity,
    ...networkDiag,
    device_id: deviceId,
    agent_version: '0.1.0',
    scan_duration_ms: scanDuration,
  }
}

export { detectOS }
