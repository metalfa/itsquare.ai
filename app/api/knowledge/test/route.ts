/**
 * RAG Pipeline Verification Endpoint
 *
 * GET /api/knowledge/test
 *
 * Tests every link in the chain:
 * 1. Database tables exist
 * 2. pgvector extension is enabled
 * 3. Embedding generation works (AI Gateway → OpenAI)
 * 4. Document ingestion works (chunk + embed + store)
 * 5. Vector search works (query → retrieve)
 * 6. Cleanup (removes test data)
 *
 * Returns a step-by-step report with pass/fail for each.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding } from '@/lib/services/embeddings'
import { ingestDocument, retrieveContext, deleteDocument } from '@/lib/services/rag'

interface TestStep {
  step: number
  name: string
  status: 'pass' | 'fail' | 'skip'
  detail: string
  durationMs?: number
}

export async function GET() {
  const steps: TestStep[] = []
  const supabase = createAdminClient()
  let testDocId: string | null = null
  let testWorkspaceId: string | null = null

  // -------------------------------------------------------------------
  // Step 1: Check database tables exist
  // -------------------------------------------------------------------
  const t1 = Date.now()
  try {
    const { error: docErr } = await supabase
      .from('knowledge_documents')
      .select('id')
      .limit(1)

    const { error: chunkErr } = await supabase
      .from('knowledge_chunks')
      .select('id')
      .limit(1)

    if (docErr || chunkErr) {
      steps.push({
        step: 1,
        name: 'Database tables',
        status: 'fail',
        detail: `Tables missing. Run supabase/migrations/001_knowledge_base.sql in Supabase SQL Editor. Error: ${docErr?.message || chunkErr?.message}`,
        durationMs: Date.now() - t1,
      })
      return NextResponse.json({ steps, overall: 'FAIL — run the migration first' })
    }

    steps.push({
      step: 1,
      name: 'Database tables',
      status: 'pass',
      detail: 'knowledge_documents and knowledge_chunks tables exist',
      durationMs: Date.now() - t1,
    })
  } catch (e: any) {
    steps.push({ step: 1, name: 'Database tables', status: 'fail', detail: e.message })
    return NextResponse.json({ steps, overall: 'FAIL' })
  }

  // -------------------------------------------------------------------
  // Step 2: Check pgvector extension
  // -------------------------------------------------------------------
  const t2 = Date.now()
  try {
    const { error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: JSON.stringify(new Array(1536).fill(0)),
      match_workspace_id: '00000000-0000-0000-0000-000000000000',
      match_threshold: 0.99,
      match_count: 1,
    })

    // We expect 0 results (no data for fake workspace) but NO error about missing function
    if (error && error.message.includes('does not exist')) {
      steps.push({
        step: 2,
        name: 'pgvector + search function',
        status: 'fail',
        detail: `match_knowledge_chunks function missing. Run the full migration SQL. Error: ${error.message}`,
        durationMs: Date.now() - t2,
      })
      return NextResponse.json({ steps, overall: 'FAIL — run the migration' })
    }

    steps.push({
      step: 2,
      name: 'pgvector + search function',
      status: 'pass',
      detail: 'pgvector extension enabled, match_knowledge_chunks function exists',
      durationMs: Date.now() - t2,
    })
  } catch (e: any) {
    steps.push({ step: 2, name: 'pgvector + search function', status: 'fail', detail: e.message })
    return NextResponse.json({ steps, overall: 'FAIL' })
  }

  // -------------------------------------------------------------------
  // Step 3: Test embedding generation (AI Gateway → OpenAI)
  // -------------------------------------------------------------------
  const t3 = Date.now()
  try {
    const embedding = await generateEmbedding('test query for WiFi troubleshooting')

    if (!embedding || embedding.length !== 1536) {
      steps.push({
        step: 3,
        name: 'Embedding generation',
        status: 'fail',
        detail: `Expected 1536-dim vector, got ${embedding?.length || 0}`,
        durationMs: Date.now() - t3,
      })
      return NextResponse.json({ steps, overall: 'FAIL' })
    }

    steps.push({
      step: 3,
      name: 'Embedding generation',
      status: 'pass',
      detail: `Generated 1536-dim embedding via AI Gateway in ${Date.now() - t3}ms`,
      durationMs: Date.now() - t3,
    })
  } catch (e: any) {
    steps.push({
      step: 3,
      name: 'Embedding generation',
      status: 'fail',
      detail: `AI Gateway / OpenAI embedding failed: ${e.message}`,
      durationMs: Date.now() - t3,
    })
    return NextResponse.json({ steps, overall: 'FAIL — check AI Gateway config' })
  }

  // -------------------------------------------------------------------
  // Step 4: Get a real workspace ID for testing
  // -------------------------------------------------------------------
  const t4 = Date.now()
  try {
    const { data: ws } = await supabase
      .from('slack_workspaces')
      .select('id')
      .eq('status', 'active')
      .limit(1)
      .single()

    if (!ws) {
      steps.push({
        step: 4,
        name: 'Workspace lookup',
        status: 'skip',
        detail: 'No active workspace found. Steps 5-7 require a Slack workspace. Skipping ingestion test.',
        durationMs: Date.now() - t4,
      })
      return NextResponse.json({
        steps,
        overall: 'PARTIAL — embedding works, but no workspace to test full pipeline',
      })
    }

    testWorkspaceId = ws.id
    steps.push({
      step: 4,
      name: 'Workspace lookup',
      status: 'pass',
      detail: `Found active workspace: ${testWorkspaceId}`,
      durationMs: Date.now() - t4,
    })
  } catch (e: any) {
    steps.push({ step: 4, name: 'Workspace lookup', status: 'fail', detail: e.message })
    return NextResponse.json({ steps, overall: 'FAIL' })
  }

  // -------------------------------------------------------------------
  // Step 5: Test document ingestion (chunk + embed + store)
  // -------------------------------------------------------------------
  const t5 = Date.now()
  try {
    const testContent = `ITSquare RAG Verification Document.

To connect to the company VPN, install GlobalProtect from the IT self-service portal at https://it.example.com/vpn. Your username is your email address and the password is your SSO password.

For WiFi issues in the Chicago office, the network name is "ITSquare-Corp" and the password is posted on the IT board in the breakroom. Guest WiFi is "ITSquare-Guest" with no password required.

Printer setup instructions: Go to System Preferences, click Printers, click the plus button, and select "Floor3-HP-Color" for the third floor or "Floor2-Canon" for the second floor.`

    const result = await ingestDocument(
      testWorkspaceId!,
      '__RAG_TEST_DOC__',
      testContent,
      'manual',
      undefined,
      'rag-test',
    )

    if (result.status !== 'success') {
      steps.push({
        step: 5,
        name: 'Document ingestion',
        status: 'fail',
        detail: `Ingestion failed: ${result.error}`,
        durationMs: Date.now() - t5,
      })
      // Try cleanup
      if (result.documentId) await deleteDocument(testWorkspaceId!, result.documentId)
      return NextResponse.json({ steps, overall: 'FAIL' })
    }

    testDocId = result.documentId

    steps.push({
      step: 5,
      name: 'Document ingestion',
      status: 'pass',
      detail: `Ingested "${testContent.length}" chars → ${result.chunkCount} chunks with embeddings in ${Date.now() - t5}ms`,
      durationMs: Date.now() - t5,
    })
  } catch (e: any) {
    steps.push({ step: 5, name: 'Document ingestion', status: 'fail', detail: e.message })
    return NextResponse.json({ steps, overall: 'FAIL' })
  }

  // -------------------------------------------------------------------
  // Step 6: Test vector search (query → retrieve relevant chunks)
  // -------------------------------------------------------------------
  const t6 = Date.now()
  try {
    const results = await retrieveContext(testWorkspaceId!, 'How do I connect to VPN?')

    if (results.length === 0) {
      steps.push({
        step: 6,
        name: 'Vector search',
        status: 'fail',
        detail: 'Query returned 0 results. The embedding or search function may not be working correctly.',
        durationMs: Date.now() - t6,
      })
    } else {
      const topResult = results[0]
      const containsVPN = topResult.content.toLowerCase().includes('vpn')

      steps.push({
        step: 6,
        name: 'Vector search',
        status: containsVPN ? 'pass' : 'fail',
        detail: containsVPN
          ? `Found ${results.length} results. Top match (similarity: ${topResult.similarity.toFixed(3)}) correctly contains VPN info.`
          : `Found ${results.length} results but top match doesn't contain VPN info. Content: "${topResult.content.slice(0, 100)}..."`,
        durationMs: Date.now() - t6,
      })
    }
  } catch (e: any) {
    steps.push({ step: 6, name: 'Vector search', status: 'fail', detail: e.message })
  }

  // -------------------------------------------------------------------
  // Step 7: Cleanup — delete test document
  // -------------------------------------------------------------------
  const t7 = Date.now()
  try {
    if (testDocId && testWorkspaceId) {
      const deleted = await deleteDocument(testWorkspaceId, testDocId)
      steps.push({
        step: 7,
        name: 'Cleanup',
        status: deleted ? 'pass' : 'fail',
        detail: deleted ? 'Test document deleted' : 'Failed to delete test document',
        durationMs: Date.now() - t7,
      })
    }
  } catch (e: any) {
    steps.push({ step: 7, name: 'Cleanup', status: 'fail', detail: e.message })
  }

  // -------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------
  const failed = steps.filter((s) => s.status === 'fail')
  const overall =
    failed.length === 0
      ? '✅ ALL PASS — RAG pipeline is fully operational'
      : `❌ ${failed.length} step(s) failed: ${failed.map((s) => s.name).join(', ')}`

  const totalMs = steps.reduce((sum, s) => sum + (s.durationMs || 0), 0)

  return NextResponse.json({ steps, overall, totalMs })
}
