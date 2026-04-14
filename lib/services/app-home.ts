/**
 * App Home tab view builder.
 * Constructs the Slack Block Kit "home" surface shown when users open the
 * ITSquare App Home tab.
 */

import { getMonthlyUsage, checkUsageLimits } from '@/lib/services/usage'

/**
 * Build the full Block Kit App Home view for a given workspace.
 * Fetches real usage stats and returns a Slack `home` surface object.
 */
export async function buildAppHomeView(
  workspaceId: string,
): Promise<Record<string, unknown>> {
  // Fetch real usage data
  const [usage, usageStatus] = await Promise.all([
    getMonthlyUsage(workspaceId),
    checkUsageLimits(workspaceId),
  ])

  const isPro = usageStatus.plan !== 'free'
  const planLabel = isPro ? '⚡ Pro Plan' : 'Free Plan'
  const limitLabel = isPro ? 'unlimited' : String(usageStatus.limit)
  const usageLabel = `${usage} / ${limitLabel}`

  return {
    type: 'home',
    blocks: [
      // ── Header ──────────────────────────────────────────────────────────
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🤖 ITSquare.AI — Your AI IT Support Agent',
          emoji: true,
        },
      },

      // ── Description ─────────────────────────────────────────────────────
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'I solve IT problems directly in Slack so your team doesn\'t lose hours waiting for help.',
        },
      },

      { type: 'divider' },

      // ── Stats ────────────────────────────────────────────────────────────
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📊 This Month*',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Messages used: *${usageLabel}*     Plan: *${planLabel}*`,
          },
        ],
      },

      { type: 'divider' },

      // ── Quick Actions ─────────────────────────────────────────────────────
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*🚀 Quick Actions*',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '💬 Ask a question',
              emoji: true,
            },
            action_id: 'home_ask_question',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '📚 Knowledge Base',
              emoji: true,
            },
            url: 'https://itsquare.ai/dashboard/knowledge',
            action_id: 'home_knowledge_base',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '⚙️ Settings',
              emoji: true,
            },
            url: 'https://itsquare.ai/dashboard',
            action_id: 'home_settings',
          },
        ],
      },

      { type: 'divider' },

      // ── How it works ──────────────────────────────────────────────────────
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            '*How to use ITSquare:*',
            '• DM me directly with any IT question',
            '• @mention me in any channel',
            '• Use /itsquare followed by your question',
            '',
            "I'll diagnose issues, search your knowledge base, and escalate to your IT team when needed.",
          ].join('\n'),
        },
      },

      { type: 'divider' },

      // ── Footer ────────────────────────────────────────────────────────────
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'ITSquare.AI • <https://itsquare.ai|itsquare.ai> • support@itsquare.ai',
          },
        ],
      },
    ],
  }
}
