/**
 * Slack Block Kit message builder for command execution UI.
 *
 * Builds interactive messages with buttons for:
 * - [▶ Run All] — batch execute Tier 1 commands
 * - [📋 Review Each] — approve commands individually
 * - [❌ Skip] — skip command execution entirely
 */

import type { ParsedCommand } from './command-safety'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlackBlock {
  type: string
  text?: any
  elements?: any[]
  block_id?: string
  accessory?: any
  [key: string]: any
}

// ---------------------------------------------------------------------------
// Command Execution Proposal
// ---------------------------------------------------------------------------

/**
 * Build a Block Kit message proposing command execution.
 * Shows the diagnosis, commands to run, and action buttons.
 */
export function buildCommandProposalBlocks(
  executionRequestId: string,
  diagnosis: string,
  commands: ParsedCommand[],
): SlackBlock[] {
  const blocks: SlackBlock[] = []

  // Diagnosis section
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: diagnosis,
    },
  })

  blocks.push({ type: 'divider' })

  // Command list
  const commandList = commands
    .map((cmd, i) => {
      const tierIcon = cmd.tier === 1 ? '🔍' : cmd.tier === 2 ? '🔧' : '⚠️'
      return `${tierIcon} \`${cmd.command}\`\n_${cmd.explanation}_`
    })
    .join('\n\n')

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Commands I'd like to run:*\n\n${commandList}`,
    },
  })

  // Tier legend (only if mixed tiers)
  const tiers = new Set(commands.map((c) => c.tier))
  if (tiers.size > 1 || tiers.has(2) || tiers.has(3)) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '🔍 = read-only diagnostic  •  🔧 = safe modification  •  ⚠️ = system change',
        },
      ],
    })
  }

  blocks.push({ type: 'divider' })

  // Action buttons
  const actions: any[] = [
    {
      type: 'button',
      text: { type: 'plain_text', text: '▶ Run All', emoji: true },
      style: 'primary',
      action_id: 'exec_run_all',
      value: executionRequestId,
    },
    {
      type: 'button',
      text: { type: 'plain_text', text: '📋 Review Each', emoji: true },
      action_id: 'exec_review_each',
      value: executionRequestId,
    },
    {
      type: 'button',
      text: { type: 'plain_text', text: '❌ Skip', emoji: true },
      action_id: 'exec_skip',
      value: executionRequestId,
    },
  ]

  blocks.push({
    type: 'actions',
    block_id: `exec_actions_${executionRequestId}`,
    elements: actions,
  })

  return blocks
}

/**
 * Build blocks for reviewing commands one at a time.
 */
export function buildReviewCommandBlock(
  executionRequestId: string,
  commandIndex: number,
  command: ParsedCommand,
  totalCommands: number,
): SlackBlock[] {
  const tierIcon = command.tier === 1 ? '🔍' : command.tier === 2 ? '🔧' : '⚠️'

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Command ${commandIndex + 1} of ${totalCommands}:*\n\n${tierIcon} \`${command.command}\`\n_${command.explanation}_`,
      },
    },
    {
      type: 'actions',
      block_id: `exec_review_${executionRequestId}_${commandIndex}`,
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '✅ Approve', emoji: true },
          style: 'primary',
          action_id: 'exec_approve_cmd',
          value: JSON.stringify({ requestId: executionRequestId, index: commandIndex }),
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '⏭️ Skip This', emoji: true },
          action_id: 'exec_skip_cmd',
          value: JSON.stringify({ requestId: executionRequestId, index: commandIndex }),
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '🛑 Cancel All', emoji: true },
          style: 'danger',
          action_id: 'exec_cancel_all',
          value: executionRequestId,
        },
      ],
    },
  ]
}

/**
 * Build a results summary after command execution.
 */
export function buildResultsBlocks(
  results: Array<{
    command: string
    stdout: string
    stderr: string
    exitCode: number
    tier: number
  }>,
): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*📊 Command Results:*',
      },
    },
  ]

  for (const result of results) {
    const statusIcon = result.exitCode === 0 ? '✅' : '❌'
    const output = result.stdout || result.stderr || '(no output)'
    // Truncate long output for Slack (3000 char limit per block)
    const truncatedOutput =
      output.length > 2500
        ? output.substring(0, 2500) + '\n... (truncated)'
        : output

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${statusIcon} \`${result.command}\`\n\`\`\`${truncatedOutput}\`\`\``,
      },
    })
  }

  return blocks
}

/**
 * Build a message for when the user needs to run commands manually
 * (when CLI agent isn't installed).
 */
export function buildManualExecutionBlocks(
  commands: ParsedCommand[],
): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: "*I don't have access to run these directly.* Here's what to run in your terminal:",
      },
    },
  ]

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i]
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${i + 1}.* ${cmd.explanation}\n\`\`\`${cmd.command}\`\`\``,
      },
    })
  }

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '_Copy and paste these into your terminal, then share the output with me so I can continue diagnosing._',
    },
  })

  return blocks
}
