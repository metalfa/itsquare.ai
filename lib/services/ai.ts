/**
 * AI service — generates IT support responses using OpenAI.
 * Single entry point for all AI generation.
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { SYSTEM_PROMPT, FALLBACK_MESSAGE } from '@/lib/config/prompts'
import { AI_MODEL, MAX_OUTPUT_TOKENS, MAX_CONTEXT_MESSAGES } from '@/lib/config/constants'
import type { ConversationMessage } from './conversation'

/**
 * Generate an AI response for an IT support conversation.
 *
 * @param userMessage - The current user message
 * @param history - Previous messages in this thread (for multi-turn)
 * @returns AI-generated response text
 */
export async function generateITResponse(
  userMessage: string,
  history: ConversationMessage[] = [],
): Promise<string> {
  try {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...history.slice(-MAX_CONTEXT_MESSAGES).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    // Only add the user message if it's not already the last message in history
    // (prevents duplication when history was just saved)
    const lastMsg = history[history.length - 1]
    if (!lastMsg || lastMsg.content !== userMessage) {
      messages.push({ role: 'user' as const, content: userMessage })
    }

    const { text } = await generateText({
      model: openai(AI_MODEL),
      messages,
      maxTokens: MAX_OUTPUT_TOKENS,
    })

    return text
  } catch (error) {
    console.error('[ITSquare] AI generation error:', error)
    return FALLBACK_MESSAGE
  }
}
