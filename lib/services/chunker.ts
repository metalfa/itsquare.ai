/**
 * Text chunking service.
 * Splits documents into overlapping chunks for embedding + retrieval.
 *
 * Strategy: sentence-aware splitting at ~512 tokens with 64 token overlap.
 * This ensures chunks don't cut mid-sentence and adjacent context is preserved.
 */

/** Rough token estimate: ~4 chars per token for English text */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export interface Chunk {
  content: string
  index: number
  tokenCount: number
}

/**
 * Split a document into chunks suitable for embedding.
 *
 * @param text - Full document text
 * @param maxTokens - Max tokens per chunk (default 512)
 * @param overlapTokens - Overlap between chunks (default 64)
 */
export function chunkText(
  text: string,
  maxTokens = 512,
  overlapTokens = 64,
): Chunk[] {
  const cleaned = text.replace(/\r\n/g, '\n').trim()
  if (!cleaned) return []

  // If document fits in a single chunk, return it
  if (estimateTokens(cleaned) <= maxTokens) {
    return [{ content: cleaned, index: 0, tokenCount: estimateTokens(cleaned) }]
  }

  // Split into sentences (preserve paragraph boundaries)
  const sentences = splitIntoSentences(cleaned)
  const chunks: Chunk[] = []
  let currentChunk: string[] = []
  let currentTokens = 0
  let chunkIndex = 0

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence)

    // If a single sentence exceeds max, force-split it
    if (sentenceTokens > maxTokens) {
      // Flush current chunk first
      if (currentChunk.length > 0) {
        const content = currentChunk.join(' ')
        chunks.push({
          content,
          index: chunkIndex++,
          tokenCount: estimateTokens(content),
        })
      }

      // Force-split the long sentence by character count
      const maxChars = maxTokens * 4
      for (let i = 0; i < sentence.length; i += maxChars - overlapTokens * 4) {
        const slice = sentence.slice(i, i + maxChars).trim()
        if (slice) {
          chunks.push({
            content: slice,
            index: chunkIndex++,
            tokenCount: estimateTokens(slice),
          })
        }
      }

      currentChunk = []
      currentTokens = 0
      continue
    }

    // Would adding this sentence exceed the limit?
    if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
      // Emit current chunk
      const content = currentChunk.join(' ')
      chunks.push({
        content,
        index: chunkIndex++,
        tokenCount: estimateTokens(content),
      })

      // Start new chunk with overlap: take the last few sentences
      const overlapChunk: string[] = []
      let overlapCount = 0
      for (let i = currentChunk.length - 1; i >= 0; i--) {
        const t = estimateTokens(currentChunk[i])
        if (overlapCount + t > overlapTokens) break
        overlapChunk.unshift(currentChunk[i])
        overlapCount += t
      }

      currentChunk = [...overlapChunk]
      currentTokens = overlapCount
    }

    currentChunk.push(sentence)
    currentTokens += sentenceTokens
  }

  // Flush remaining
  if (currentChunk.length > 0) {
    const content = currentChunk.join(' ')
    chunks.push({
      content,
      index: chunkIndex,
      tokenCount: estimateTokens(content),
    })
  }

  return chunks
}

/**
 * Split text into sentences, preserving paragraph breaks.
 */
function splitIntoSentences(text: string): string[] {
  const sentences: string[] = []

  // Split by paragraph first, then by sentence
  const paragraphs = text.split(/\n{2,}/)

  for (const para of paragraphs) {
    if (!para.trim()) continue

    // Split paragraph into sentences
    // Handles: "Mr. Smith went to Washington. He arrived at 3 p.m."
    const parts = para.split(/(?<=[.!?])\s+(?=[A-Z])/)

    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed) sentences.push(trimmed)
    }
  }

  return sentences
}
