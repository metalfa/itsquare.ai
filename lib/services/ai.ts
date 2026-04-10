/**
 * AI service — generates IT support responses via Vercel AI Gateway.
 *
 * Now with RAG: if the workspace has a knowledge base, relevant context
 * is retrieved and injected into the prompt for company-specific answers.
 */

import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { SYSTEM_PROMPT, FALLBACK_MESSAGE } from '@/lib/config/prompts'
import { AI_MODEL, MAX_OUTPUT_TOKENS, MAX_CONTEXT_MESSAGES } from '@/lib/config/constants'
import { retrieveContext, buildContextPrompt } from './rag'
import type { ConversationMessage } from './conversation'

/**
 * Generate an AI response for an IT support conversation.
 *
 * @param userMessage - The current user message
 * @param history - Previous messages in this thread (for multi-turn)
 * @param workspaceId - Optional workspace ID for RAG context
 * @returns AI-generated response text
 */
export async function generateITResponse(
  userMessage: string,
  history: ConversationMessage[] = [],
  workspaceId?: string,
): Promise<string> {
  try {
    // Retrieve relevant knowledge base context (if workspace has KB)
    let contextPrompt = ''
    if (workspaceId) {
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

    const { text } = await generateText({
      model: gateway(AI_MODEL),
      messages,
      maxTokens: MAX_OUTPUT_TOKENS,
    })

    return text
  } catch (error) {
    console.error('[ITSquare] AI generation error:', error)
    return FALLBACK_MESSAGE
  }
}
