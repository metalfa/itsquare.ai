/**
 * Knowledge Base API
 *
 * POST /api/knowledge — Add a document to the knowledge base
 * GET  /api/knowledge — List documents for the workspace
 * DELETE /api/knowledge?id=<doc_id> — Delete a document
 *
 * Auth: Requires authenticated user with org → workspace mapping.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestDocument, listDocuments, deleteDocument } from '@/lib/services/rag'

/**
 * Get the workspace ID for the current authenticated user.
 */
async function getWorkspaceId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return null

  const { data: workspace } = await supabase
    .from('slack_workspaces')
    .select('id')
    .eq('org_id', profile.org_id)
    .eq('status', 'active')
    .single()

  return workspace?.id || null
}

/**
 * POST — Add a new document to the knowledge base.
 * Body: { title: string, content: string, source_type?: string, source_url?: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const workspaceId = await getWorkspaceId(supabase)

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, content, source_type, source_url } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 },
      )
    }

    if (content.length > 500_000) {
      return NextResponse.json(
        { error: 'Content too large (max 500KB)' },
        { status: 400 },
      )
    }

    const { data: { user } } = await supabase.auth.getUser()

    const result = await ingestDocument(
      workspaceId,
      title,
      content,
      source_type || 'manual',
      source_url,
      user?.id,
    )

    if (result.status === 'error') {
      return NextResponse.json(
        { error: result.error || 'Ingestion failed' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      document_id: result.documentId,
      chunk_count: result.chunkCount,
    })
  } catch (error) {
    console.error('[ITSquare] Knowledge POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

/**
 * GET — List all documents in the workspace knowledge base.
 */
export async function GET() {
  const supabase = await createClient()
  const workspaceId = await getWorkspaceId(supabase)

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const documents = await listDocuments(workspaceId)
  return NextResponse.json({ documents })
}

/**
 * DELETE — Remove a document from the knowledge base.
 * Query: ?id=<document_id>
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const workspaceId = await getWorkspaceId(supabase)

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const docId = request.nextUrl.searchParams.get('id')
  if (!docId) {
    return NextResponse.json({ error: 'id query parameter required' }, { status: 400 })
  }

  const deleted = await deleteDocument(workspaceId, docId)

  if (!deleted) {
    return NextResponse.json({ error: 'Document not found or delete failed' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
