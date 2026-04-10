/**
 * RAG (Retrieval-Augmented Generation) service.
 *
 * Handles:
 * 1. Document ingestion: chunk → embed → store
 * 2. Context retrieval: embed query → vector search → return relevant chunks
 * 3. Prompt injection: merge retrieved context into AI prompt
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding, generateEmbeddings } from './embeddings'
import { chunkText, type Chunk } from './chunker'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IngestResult {
  documentId: string
  chunkCount: number
  status: 'success' | 'error'
  error?: string
}

export interface RetrievedContext {
  content: string
  documentId: string
  similarity: number
}

// ---------------------------------------------------------------------------
// Document Ingestion
// ---------------------------------------------------------------------------

/**
 * Ingest a document: chunk it, generate embeddings, store everything.
 * Called when an admin adds a knowledge base document.
 */
export async function ingestDocument(
  workspaceId: string,
  title: string,
  content: string,
  sourceType: 'manual' | 'url' | 'file' = 'manual',
  sourceUrl?: string,
  createdBy?: string,
): Promise<IngestResult> {
  const supabase = createAdminClient()

  // Create the document record
  const { data: doc, error: docError } = await supabase
    .from('knowledge_documents')
    .insert({
      workspace_id: workspaceId,
      title,
      content,
      source_type: sourceType,
      source_url: sourceUrl,
      created_by: createdBy,
      status: 'processing',
    })
    .select('id')
    .single()

  if (docError || !doc) {
    console.error('[ITSquare] Failed to create document:', docError)
    return { documentId: '', chunkCount: 0, status: 'error', error: docError?.message }
  }

  try {
    // Chunk the content
    const chunks = chunkText(content)

    if (chunks.length === 0) {
      await supabase
        .from('knowledge_documents')
        .update({ status: 'error', error_message: 'No content to index' })
        .eq('id', doc.id)
      return { documentId: doc.id, chunkCount: 0, status: 'error', error: 'No content to index' }
    }

    // Generate embeddings in batch
    const embeddings = await generateEmbeddings(chunks.map((c) => c.content))

    // Store chunks with embeddings
    const chunkRows = chunks.map((chunk, i) => ({
      document_id: doc.id,
      workspace_id: workspaceId,
      chunk_index: chunk.index,
      content: chunk.content,
      token_count: chunk.tokenCount,
      embedding: JSON.stringify(embeddings[i]),
    }))

    const { error: chunkError } = await supabase
      .from('knowledge_chunks')
      .insert(chunkRows)

    if (chunkError) {
      throw new Error(`Failed to store chunks: ${chunkError.message}`)
    }

    // Mark document as active
    await supabase
      .from('knowledge_documents')
      .update({
        status: 'active',
        chunk_count: chunks.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', doc.id)

    return { documentId: doc.id, chunkCount: chunks.length, status: 'success' }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ITSquare] Document ingestion error:', errorMsg)

    await supabase
      .from('knowledge_documents')
      .update({ status: 'error', error_message: errorMsg })
      .eq('id', doc.id)

    return { documentId: doc.id, chunkCount: 0, status: 'error', error: errorMsg }
  }
}

// ---------------------------------------------------------------------------
// Context Retrieval
// ---------------------------------------------------------------------------

/** Minimum similarity score to include a chunk (0.5 = broadly relevant, 0.7 = very close match) */
const SIMILARITY_THRESHOLD = 0.5

/** Maximum chunks to retrieve per query */
const MAX_CHUNKS = 5

/**
 * Retrieve relevant knowledge base context for a user query.
 * Returns empty array if no knowledge base exists for the workspace.
 */
export async function retrieveContext(
  workspaceId: string,
  query: string,
): Promise<RetrievedContext[]> {
  const supabase = createAdminClient()

  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query)

    // Call the Supabase vector search function
    const { data, error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_workspace_id: workspaceId,
      match_threshold: SIMILARITY_THRESHOLD,
      match_count: MAX_CHUNKS,
    })

    if (error) {
      console.error('[ITSquare] Vector search error:', error.message)
      return []
    }

    return (data || []).map((row: any) => ({
      content: row.content,
      documentId: row.document_id,
      similarity: row.similarity,
    }))
  } catch (error) {
    // Gracefully degrade — if RAG fails, the bot still works without context
    console.error('[ITSquare] RAG retrieval error:', error)
    return []
  }
}

// ---------------------------------------------------------------------------
// Prompt Builder
// ---------------------------------------------------------------------------

/**
 * Build a context block to inject into the AI system prompt.
 * Returns empty string if no relevant context found.
 */
export function buildContextPrompt(contexts: RetrievedContext[]): string {
  if (contexts.length === 0) return ''

  const contextBlocks = contexts
    .map((c, i) => `[${i + 1}] ${c.content}`)
    .join('\n\n')

  return `

---
COMPANY KNOWLEDGE BASE (use this to give company-specific answers):

${contextBlocks}

---
If the knowledge base contains relevant information, use it in your answer.
If it doesn't cover the topic, use your general IT knowledge instead.
Don't mention "the knowledge base" to the user — just answer naturally.`
}

// ---------------------------------------------------------------------------
// Document Management
// ---------------------------------------------------------------------------

/**
 * List all documents for a workspace.
 */
export async function listDocuments(workspaceId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('id, title, source_type, status, chunk_count, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[ITSquare] Failed to list documents:', error)
    return []
  }

  return data || []
}

/**
 * Delete a document and all its chunks (cascade).
 */
export async function deleteDocument(
  workspaceId: string,
  documentId: string,
): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('knowledge_documents')
    .delete()
    .eq('id', documentId)
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('[ITSquare] Failed to delete document:', error)
    return false
  }

  return true
}
