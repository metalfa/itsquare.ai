/**
 * API Client — communicates with the ITSquare.AI server.
 *
 * Handles:
 *   - Uploading device scans
 *   - Polling for pending execution requests
 *   - Submitting command results
 */

import type { DeviceScan, CommandResult, ExecutionRequest, AgentConfig } from './types.js'

/**
 * Upload a device scan to the server.
 */
export async function uploadScan(
  config: AgentConfig,
  scan: DeviceScan,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${config.apiUrl}/api/agent/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.workspaceToken}`,
      },
      body: JSON.stringify({
        slack_user_id: config.slackUserId,
        scan,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      return { success: false, error: `HTTP ${res.status}: ${body}` }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Poll for pending execution requests for this user.
 */
export async function pollExecutionRequests(
  config: AgentConfig,
): Promise<ExecutionRequest[]> {
  try {
    const res = await fetch(
      `${config.apiUrl}/api/agent/poll?slack_user_id=${encodeURIComponent(config.slackUserId)}`,
      {
        headers: {
          Authorization: `Bearer ${config.workspaceToken}`,
        },
      },
    )

    if (!res.ok) return []

    const data = await res.json()
    return data.requests || []
  } catch {
    return []
  }
}

/**
 * Submit execution results back to the server.
 */
export async function submitResults(
  config: AgentConfig,
  requestId: string,
  results: CommandResult[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${config.apiUrl}/api/agent/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.workspaceToken}`,
      },
      body: JSON.stringify({
        request_id: requestId,
        results,
        agent_version: '0.1.0',
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      return { success: false, error: `HTTP ${res.status}: ${body}` }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
