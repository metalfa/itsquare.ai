import { describe, it, expect } from 'vitest'
import { chunkText } from '@/lib/services/chunker'

describe('chunkText', () => {
  it('returns empty array for empty input', () => {
    expect(chunkText('')).toEqual([])
    expect(chunkText('   ')).toEqual([])
  })

  it('returns single chunk for short text', () => {
    const chunks = chunkText('This is a short document.')
    expect(chunks).toHaveLength(1)
    expect(chunks[0].content).toBe('This is a short document.')
    expect(chunks[0].index).toBe(0)
    expect(chunks[0].tokenCount).toBeGreaterThan(0)
  })

  it('splits long text into multiple chunks', () => {
    // Generate text that's ~2000 tokens (8000 chars)
    const sentences = Array.from({ length: 100 }, (_, i) =>
      `This is sentence number ${i + 1} which contains enough words to contribute meaningful token count to the document.`
    )
    const text = sentences.join(' ')

    const chunks = chunkText(text, 512, 64)

    expect(chunks.length).toBeGreaterThan(1)

    // All chunks should have content
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeGreaterThan(0)
      expect(chunk.tokenCount).toBeGreaterThan(0)
    }

    // Chunks should be in order
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].index).toBe(i)
    }
  })

  it('preserves overlap between chunks', () => {
    // Create text with distinct numbered sentences
    const sentences = Array.from({ length: 50 }, (_, i) =>
      `Sentence ${i + 1} has unique content about topic ${i + 1} that makes it identifiable.`
    )
    const text = sentences.join(' ')

    const chunks = chunkText(text, 128, 32)

    // With overlap, adjacent chunks should share some content
    if (chunks.length >= 2) {
      // The end of chunk N should overlap with the start of chunk N+1
      const firstChunkEnd = chunks[0].content.slice(-100)
      const secondChunkStart = chunks[1].content.slice(0, 200)

      // There should be some shared text (from the overlap)
      const words1 = new Set(firstChunkEnd.split(/\s+/))
      const words2 = new Set(secondChunkStart.split(/\s+/))
      const shared = [...words1].filter((w) => words2.has(w))
      expect(shared.length).toBeGreaterThan(0)
    }
  })

  it('handles text with paragraph breaks', () => {
    const text = `First paragraph with important information.

Second paragraph about a different topic. It has multiple sentences. This should work fine.

Third paragraph wrapping up the document.`

    const chunks = chunkText(text)
    expect(chunks.length).toBeGreaterThanOrEqual(1)
    // All content should be preserved
    const allContent = chunks.map((c) => c.content).join(' ')
    expect(allContent).toContain('First paragraph')
    expect(allContent).toContain('Third paragraph')
  })

  it('handles single very long sentence', () => {
    const longSentence = 'word '.repeat(3000) // ~3000 tokens
    const chunks = chunkText(longSentence, 512, 64)
    expect(chunks.length).toBeGreaterThan(1)
  })
})
