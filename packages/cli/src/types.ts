/**
 * CLI Agent types.
 */

export type Platform = 'darwin' | 'win32' | 'linux'

export interface DeviceScan {
  hostname: string
  osName: string
  osVersion: string
  cpuModel: string
  ramTotalGb: number
  ramAvailableGb: number
  diskTotalGb: number
  diskAvailableGb: number
  uptimeDays: number
  topProcesses: ProcessInfo[]
  firewallEnabled: boolean | null
  diskEncrypted: boolean | null
  platform: Platform
  agentVersion: string
  scannedAt: string
}

export interface ProcessInfo {
  name: string
  cpu_pct: number
  mem_mb: number
}

export interface CommandResult {
  command: string
  stdout: string
  stderr: string
  exitCode: number
  tier: number
  executedAt: string
}

export interface ExecutionRequest {
  id: string
  commands: Array<{
    command: string
    tier: number
    explanation: string
    platform: string
  }>
  purpose: string
  platform: string
  status: string
}

export interface AgentConfig {
  apiUrl: string
  workspaceToken: string
  slackUserId: string
}
