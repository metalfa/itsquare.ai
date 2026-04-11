/**
 * Command Parser — extracts structured command proposals from AI responses.
 *
 * The AI is prompted to output command proposals in a structured format.
 * This parser extracts them and validates against the safety model.
 *
 * Format the AI outputs:
 *   [COMMANDS]
 *   ping -c 5 8.8.8.8 | Check internet connectivity
 *   nslookup google.com | Check DNS resolution
 *   cat /etc/resolv.conf | Check DNS configuration
 *   [/COMMANDS]
 *
 * The parser extracts these, validates each, and returns structured data
 * for the Slack Block Kit UI.
 */

import { validateCommand, type ParsedCommand } from './command-safety'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommandParseResult {
  /** The AI response text with the [COMMANDS] block stripped out */
  cleanText: string
  /** Parsed and validated commands, or null if no commands were proposed */
  commands: ParsedCommand[] | null
  /** Whether any commands were blocked by safety rules */
  hasBlockedCommands: boolean
  /** Commands that were blocked (for logging) */
  blockedCommands: Array<{ command: string; reason: string }>
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

const COMMANDS_BLOCK_REGEX = /\[COMMANDS\]\n([\s\S]*?)\n\[\/COMMANDS\]/

/**
 * Parse an AI response for command proposals.
 */
export function parseCommandResponse(
  aiResponse: string,
  platform: 'darwin' | 'win32' | 'linux' = 'darwin',
): CommandParseResult {
  const match = COMMANDS_BLOCK_REGEX.exec(aiResponse)

  if (!match) {
    return {
      cleanText: aiResponse,
      commands: null,
      hasBlockedCommands: false,
      blockedCommands: [],
    }
  }

  const commandBlock = match[1]
  const cleanText = aiResponse.replace(COMMANDS_BLOCK_REGEX, '').trim()

  const lines = commandBlock
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const commands: ParsedCommand[] = []
  const blockedCommands: Array<{ command: string; reason: string }> = []

  for (const line of lines) {
    const pipeIndex = line.indexOf(' | ')
    let cmd: string
    let explanation: string

    if (pipeIndex > 0) {
      cmd = line.substring(0, pipeIndex).trim()
      explanation = line.substring(pipeIndex + 3).trim()
    } else {
      cmd = line.trim()
      explanation = 'Run diagnostic command'
    }

    const validation = validateCommand(cmd)

    if (validation.tier === 4) {
      // Blocked — don't include, log it
      blockedCommands.push({
        command: cmd,
        reason: validation.reason || 'Blocked by safety rules',
      })
      continue
    }

    if (validation.allowed) {
      commands.push({
        command: cmd,
        tier: validation.tier as 1 | 2 | 3,
        explanation,
        platform,
      })
    } else {
      // Tier 3 — include but flag as requiring manual execution
      commands.push({
        command: cmd,
        tier: 3,
        explanation: `${explanation} _(requires manual execution)_`,
        platform,
      })
    }
  }

  return {
    cleanText,
    commands: commands.length > 0 ? commands : null,
    hasBlockedCommands: blockedCommands.length > 0,
    blockedCommands,
  }
}

/**
 * Detect the platform from device scan data or Slack user agent.
 */
export function detectPlatform(
  osName?: string | null,
): 'darwin' | 'win32' | 'linux' {
  if (!osName) return 'darwin' // default assumption

  const lower = osName.toLowerCase()
  if (lower.includes('mac') || lower.includes('darwin')) return 'darwin'
  if (lower.includes('windows') || lower.includes('win')) return 'win32'
  if (lower.includes('linux') || lower.includes('ubuntu') || lower.includes('debian')) return 'linux'

  return 'darwin'
}
