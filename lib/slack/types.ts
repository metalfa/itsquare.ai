// Slack-related TypeScript types

export interface SlackWorkspace {
  id: string
  team_id: string
  team_name: string
  team_domain: string | null
  bot_token_encrypted: string
  bot_user_id: string
  installed_by_slack_user_id: string
  org_id: string | null
  scopes: string[] | null
  is_enterprise: boolean
  enterprise_id: string | null
  status: 'active' | 'revoked' | 'error'
  installed_at: string
  created_at: string
  updated_at: string
}

export interface SlackUser {
  id: string
  workspace_id: string
  slack_user_id: string
  slack_username: string | null
  display_name: string | null
  email: string | null
  avatar_url: string | null
  is_admin: boolean
  is_owner: boolean
  user_id: string | null
  first_seen_at: string
  last_interaction_at: string
  created_at: string
  updated_at: string
}

export interface AgentToken {
  id: string
  token_hash: string
  token_prefix: string
  workspace_id: string | null
  slack_user_id: string | null
  name: string | null
  device_identifier: string | null
  scopes: string[]
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
}

export interface DeviceScan {
  id: string
  agent_token_id: string
  slack_user_id: string | null
  workspace_id: string | null
  device_id: string | null
  hostname: string | null
  os_type: 'macos' | 'windows' | 'linux' | null
  os_version: string | null
  os_build: string | null
  cpu_model: string | null
  cpu_cores: number | null
  ram_total_gb: number | null
  disk_total_gb: number | null
  disk_free_gb: number | null
  firewall_enabled: boolean | null
  filevault_enabled: boolean | null
  bitlocker_enabled: boolean | null
  gatekeeper_enabled: boolean | null
  sip_enabled: boolean | null
  secure_boot_enabled: boolean | null
  antivirus_installed: boolean | null
  antivirus_name: string | null
  antivirus_up_to_date: boolean | null
  os_up_to_date: boolean | null
  pending_updates: number
  last_update_check: string | null
  browser_extensions: Record<string, unknown> | null
  installed_apps: Record<string, unknown> | null
  wifi_security_type: string | null
  vpn_connected: boolean | null
  security_score: number | null
  compliance_score: number | null
  overall_health_score: number | null
  issues: DeviceIssue[] | null
  issue_count_critical: number
  issue_count_high: number
  issue_count_medium: number
  issue_count_low: number
  ai_summary: string | null
  ai_recommendations: string[] | null
  scan_duration_ms: number | null
  agent_version: string | null
  raw_scan_data: Record<string, unknown> | null
  created_at: string
}

export interface DeviceIssue {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  remediation?: string
}

export interface SlackConversation {
  id: string
  workspace_id: string
  slack_user_id: string
  channel_id: string
  thread_ts: string | null
  message_role: 'user' | 'assistant' | 'system'
  message_content: string
  message_ts: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AccessRequest {
  id: string
  workspace_id: string
  requester_slack_user_id: string
  app_name: string
  app_icon_url: string | null
  reason: string | null
  urgency: 'low' | 'normal' | 'high' | 'critical'
  status: 'pending' | 'approved' | 'denied' | 'provisioned' | 'expired'
  approver_slack_user_id: string | null
  approval_message_ts: string | null
  approval_channel_id: string | null
  provisioned_via: string | null
  provisioned_at: string | null
  requested_at: string
  responded_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

// Slack API response types
export interface SlackOAuthResponse {
  ok: boolean
  access_token: string
  token_type: string
  scope: string
  bot_user_id: string
  app_id: string
  team: {
    id: string
    name: string
  }
  enterprise?: {
    id: string
    name: string
  }
  authed_user: {
    id: string
    scope: string
    access_token: string
    token_type: string
  }
  error?: string
}

export interface SlackUserInfo {
  id: string
  name: string
  real_name?: string
  profile: {
    email?: string
    display_name?: string
    image_72?: string
    image_192?: string
  }
  is_admin?: boolean
  is_owner?: boolean
}
