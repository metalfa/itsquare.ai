export type OSType = 'macos' | 'windows' | 'linux'

export interface DeviceScanResult {
  // Device identification
  device_id?: string
  hostname?: string
  
  // Operating system
  os_type?: OSType
  os_version?: string
  os_build?: string
  
  // Hardware
  cpu_model?: string
  cpu_cores?: number
  ram_total_gb?: number
  disk_total_gb?: number
  disk_free_gb?: number
  
  // Security - Firewall
  firewall_enabled?: boolean
  
  // Security - Disk encryption
  filevault_enabled?: boolean      // macOS
  bitlocker_enabled?: boolean      // Windows
  
  // Security - macOS specific
  gatekeeper_enabled?: boolean
  sip_enabled?: boolean
  
  // Security - Windows specific
  secure_boot_enabled?: boolean
  
  // Antivirus
  antivirus_installed?: boolean
  antivirus_name?: string
  antivirus_up_to_date?: boolean
  
  // Updates
  os_up_to_date?: boolean
  pending_updates?: number
  last_update_check?: string
  
  // Network
  wifi_security_type?: string
  vpn_connected?: boolean
  internet_connected?: boolean
  dns_servers?: string[]
  
  // Network diagnostics
  ping_google_ms?: number
  ping_cloudflare_ms?: number
  
  // Browser extensions (for potential security risks)
  browser_extensions?: Record<string, unknown>
  
  // Installed applications
  installed_apps?: Record<string, unknown>
  
  // Agent metadata
  agent_version?: string
  scan_duration_ms?: number
  
  // Raw data for debugging
  raw_scan_data?: Record<string, unknown>
}

export interface ScanResponse {
  success: boolean
  scan_id?: string
  security_score?: number
  compliance_score?: number
  overall_health_score?: number
  issues_count?: number
  issues_by_severity?: {
    critical: number
    high: number
    medium: number
    low: number
  }
  message?: string
  error?: string
}
