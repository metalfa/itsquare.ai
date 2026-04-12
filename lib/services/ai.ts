/**
 * AI service — generates IT support responses via Vercel AI Gateway.
 *
 * Resolution Engine: every conversation triggers a 4-source investigation.
 * Results are synthesized into context that the AI uses to diagnose and resolve.
 */

import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { SYSTEM_PROMPT, FALLBACK_MESSAGE } from '@/lib/config/prompts'
import { AI_MODEL, MAX_OUTPUT_TOKENS, MAX_CONTEXT_MESSAGES } from '@/lib/config/constants'
import { investigate } from './investigation'
import { buildInvestigationPrompt } from './context-builder'
import { retrieveContext, buildContextPrompt } from './rag'
import type { ConversationMessage } from './conversation'

/**
 * Generate an AI response for an IT support conversation.
 *
 * Uses the full Resolution Engine when workspace + user info is available.
 * Falls back to basic RAG-only mode when user identity isn't known (e.g. slash commands).
 *
 * @param userMessage - The current user message
 * @param history - Previous messages in this thread (for multi-turn)
 * @param workspaceId - Optional workspace ID for investigation
 * @param slackUserId - Optional Slack user ID for personalized context
 */
export async function generateITResponse(
  userMessage: string,
  history: ConversationMessage[] = [],
  workspaceId?: string,
  slackUserId?: string,
): Promise<string> {
  try {
    let contextPrompt = ''

    if (workspaceId && slackUserId) {
      // Full Resolution Engine — 4-source investigation
      const investigationCtx = await investigate(workspaceId, slackUserId, userMessage)
      contextPrompt = buildInvestigationPrompt(investigationCtx)
    } else if (workspaceId) {
      // Fallback: KB-only (e.g. slash commands where we don't have user identity)
      const contexts = await retrieveContext(workspaceId, userMessage)
      contextPrompt = buildContextPrompt(contexts)
    }

    const systemMessage = SYSTEM_PROMPT + contextPrompt

    const messages = [
      { role: 'system' as const, content: systemMessage },
      ...history.slice(-MAX_CONTEXT_MESSAGES).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    // Only add the user message if it's not already the last in history
    const lastMsg = history[history.length - 1]
    if (!lastMsg || lastMsg.content !== userMessage) {
      messages.push({ role: 'user' as const, content: userMessage })
    }

    // Try AI generation with one retry on failure
    let lastError: unknown
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { text } = await generateText({
          model: gateway(AI_MODEL),
          messages,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        })
        return text
      } catch (err) {
        lastError = err
        console.error(`[ITSquare] AI generation error (attempt ${attempt + 1}):`, err)
        if (attempt === 0) {
          // Brief pause before retry
          await new Promise((r) => setTimeout(r, 1000))
        }
      }
    }

    console.error('[ITSquare] AI generation failed after 2 attempts:', lastError)
    return FALLBACK_MESSAGE
  } catch (error) {
    console.error('[ITSquare] Investigation/context error:', error)
    return FALLBACK_MESSAGE
  }
}
