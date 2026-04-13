/**
 * Solution Tracker — tracks solution effectiveness and auto-extracts to KB.
 *
 * Features:
 * - Auto-extract proven solutions to knowledge base
 * - Confidence decay for aging solutions
 * - Solution effectiveness scoring
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding } from './embeddings'
import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { AI_MODEL } from '@/lib/config/constants'

// ---------------------------------------------------------------------------
// Auto-Extract to Knowledge Base
// ---------------------------------------------------------------------------

/**
 * When a resolution is confirmed working, extract it as a KB article.
 * Only creates the KB entry if a similar one doesn't already exist.
 */
export async function autoExtractToKB(
  workspaceId: string,
  threadId: string,
  resolutionSummary: string,
): Promise<void> {
  const supabase = createAdminClient()

  // Get the thread's topic for context
  const { data: thread } = await supabase
    .from('conversation_threads')
    .select('topic, slack_user_id, resolution_confidence, times_worked')
    .eq('id', threadId)
    .single()

  if (!thread || !thread.topic) return

  // Only extract if the solution has been confirmed at least once
  if ((thread.times_worked || 0) < 1) return

  // Check if a similar KB article already exists
  const embedding = await generateEmbedding(resolutionSummary)
  const { data: existing } = await supabase.rpc('match_knowledge_chunks', {
    query_embedding: JSON.stringify(embedding),
    match_workspace_id: workspaceId,
    match_threshold: 0.85, // High threshold = very similar
    match_count: 1,
  })

  if (existing && existing.length > 0) {
    // Similar article already exists — skip
    return
  }

  // Generate a clean KB article from the resolution
  const { text: article } = await generateText({
    model: gateway(AI_MODEL),
    messages: [
      {
        role: 'system',
        content: `Convert this IT support resolution into a brief, reusable knowledge base article.
Format:
## [Problem Title]
**Problem:** [1 sentence]
**Solution:** [step-by-step fix]
**Source:** Auto-extracted from resolved support conversation

Keep it under 100 words. Be specific and actionable.`,
      },
      {
        role: 'user',
        content: `Issue: ${thread.topic}\nResolution: ${resolutionSummary}`,
      },
    ],
    maxTokens: 200,
  })

  // Store as a knowledge document
  const { data: doc, error: docErr } = await supabase
    .from('knowledge_documents')
    .insert({
      workspace_id: workspaceId,
      title: `Auto: ${thread.topic}`,
      source_type: 'auto_extracted',
      content: article.trim(),
      status: 'active',
    })
    .select('id')
    .single()

  if (docErr || !doc) {
    console.error('[ITSquare] Auto-extract doc insert failed:', docErr?.message)
    return
  }

  // Create the chunk with embedding for vector search
  const articleEmbedding = await generateEmbedding(article.trim())

  await supabase
    .from('knowledge_chunks')
    .insert({
      document_id: doc.id,
      workspace_id: workspaceId,
      chunk_index: 0,
      content: article.trim(),
      embedding: JSON.stringify(articleEmbedding),
    })

  console.log(`[ITSquare] Auto-extracted KB article: "${thread.topic}" (confidence: ${thread.resolution_confidence})`)
}

// ---------------------------------------------------------------------------
// Confidence Decay
// ---------------------------------------------------------------------------

/**
 * Decay confidence scores for old resolutions.
 * Call this periodically (e.g., weekly cron).
 *
 * Rules:
 * - Resolutions older than 30 days lose 5% confidence per month
 * - Never decay below 0.3 (always keep some value)
 * - Only decay "resolved" threads (not open or escalated)
 * - Skip threads with recent activity (updated_at within 14 days)
 */
export async function decayConfidenceScores(workspaceId: string): Promise<{
  decayed: number
  flagged: number
}> {
  const supabase = createAdminClient()

  // Find resolved threads older than 30 days with no recent updates
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: threads, error } = await supabase
    .from('conversation_threads')
    .select('id, resolution_confidence, resolved_at')
    .eq('workspace_id', workspaceId)
    .eq('status', 'resolved')
    .lt('resolved_at', thirtyDaysAgo)
    .lt('updated_at', fourteenDaysAgo)
    .gt('resolution_confidence', 0.3) // Don't decay below floor

  if (error || !threads) return { decayed: 0, flagged: 0 }

  let decayed = 0
  let flagged = 0

  for (const thread of threads) {
    // Calculate months since resolution
    const monthsSinceResolved = Math.floor(
      (Date.now() - new Date(thread.resolved_at).getTime()) / (30 * 24 * 60 * 60 * 1000)
    )

    // 5% decay per month after the first month
    const decayFactor = Math.max(0.3, 1 - (monthsSinceResolved - 1) * 0.05)
    const newConfidence = Math.max(0.3, Math.round(thread.resolution_confidence * decayFactor * 100) / 100)

    if (newConfidence < thread.resolution_confidence) {
      await supabase
        .from('conversation_threads')
        .update({
          resolution_confidence: newConfidence,
          updated_at: new Date().toISOString(),
        })
        .eq('id', thread.id)
      decayed++
    }

    // Flag low-confidence solutions for review
    if (newConfidence <= 0.4) {
      flagged++
    }
  }

  return { decayed, flagged }
}

// ---------------------------------------------------------------------------
// Solution Stats
// ---------------------------------------------------------------------------

/**
 * Get effectiveness stats for a workspace's solutions.
 */
export async function getSolutionStats(workspaceId: string): Promise<{
  totalResolved: number
  avgConfidence: number
  lowConfidenceCount: number
  autoExtractedCount: number
}> {
  const supabase = createAdminClient()

  const { data: threads } = await supabase
    .from('conversation_threads')
    .select('resolution_confidence, times_worked, times_failed')
    .eq('workspace_id', workspaceId)
    .eq('status', 'resolved')

  if (!threads || threads.length === 0) {
    return { totalResolved: 0, avgConfidence: 0, lowConfidenceCount: 0, autoExtractedCount: 0 }
  }

  const avgConfidence = threads.reduce((sum, t) => sum + (t.resolution_confidence || 0), 0) / threads.length
  const lowConfidence = threads.filter((t) => (t.resolution_confidence || 0) < 0.5).length

  // Count auto-extracted KB articles
  const { count } = await supabase
    .from('knowledge_documents')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('source_type', 'auto_extracted')

  return {
    totalResolved: threads.length,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    lowConfidenceCount: lowConfidence,
    autoExtractedCount: count || 0,
  }
}
