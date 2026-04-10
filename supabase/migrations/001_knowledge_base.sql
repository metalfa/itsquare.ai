-- Sprint 2: Knowledge Base / RAG
-- Run this in Supabase SQL Editor
-- Prerequisites: pgvector extension

-- Enable pgvector for embedding storage
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base documents (source files uploaded by admins)
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('manual', 'url', 'file')),
  source_url TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'active', 'error', 'archived')),
  error_message TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_by TEXT, -- slack_user_id who uploaded
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chunked + embedded content for vector search
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  embedding vector(1536), -- text-embedding-3-small dimension
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_workspace
  ON knowledge_chunks(workspace_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document
  ON knowledge_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_workspace
  ON knowledge_documents(workspace_id);

-- HNSW index for fast vector similarity search
-- Using cosine distance (most common for text embeddings)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- RLS policies (workspace isolation)
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by our API routes)
CREATE POLICY "Service role full access on knowledge_documents"
  ON knowledge_documents FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on knowledge_chunks"
  ON knowledge_chunks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to search knowledge base by embedding similarity
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_workspace_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    kc.id,
    kc.document_id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE kc.workspace_id = match_workspace_id
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;
