/**
 * Embedding service — generates vector embeddings via Vercel AI Gateway.
 * Uses OpenAI text-embedding-3-small (1536 dimensions).
 */

import { embed, embedMany } from 'ai'
import { gateway } from '@ai-sdk/gateway'

const EMBEDDING_MODEL = 'openai/text-embedding-3-small'

/**
 * Generate a single embedding vector for a query string.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: gateway.textEmbeddingModel(EMBEDDING_MODEL),
    value: text,
  })
  return embedding
}

/**
 * Generate embeddings for multiple chunks in a single batch.
 * More efficient than calling generateEmbedding() in a loop.
 */
export async function generateEmbeddings(
  texts: string[],
): Promise<number[][]> {
  if (texts.length === 0) return []

  const { embeddings } = await embedMany({
    model: gateway.textEmbeddingModel(EMBEDDING_MODEL),
    values: texts,
  })
  return embeddings
}
