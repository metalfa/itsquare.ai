-- =============================================================================
-- Migration 012: Fix vector functions — definitive fix
--
-- History of failures:
--   009: SET search_path = '' broke <=> operator (needs public in path)
--   010: UPDATE pg_extension failed — permission denied (not superuser)
--   011: extensions.vector type doesn't exist — extension never moved
--
-- Actual state: vector extension is in PUBLIC schema (always was, always will be).
-- Fix: recreate 4 vector functions with search_path = 'public' and plain vector(1536).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
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
SET search_path = 'public'
AS $$
  SELECT
    kc.id,
    kc.document_id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  WHERE kc.workspace_id = match_workspace_id
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_user_history(
  query_embedding vector(1536),
  match_workspace_id UUID,
  match_slack_user_id TEXT,
  match_threshold REAL DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  topic TEXT,
  resolution_summary TEXT,
  status TEXT,
  resolution_confidence REAL,
  similarity REAL,
  created_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
)
LANGUAGE sql STABLE
SET search_path = 'public'
AS $$
  SELECT
    ct.id,
    ct.topic,
    ct.resolution_summary,
    ct.status,
    ct.resolution_confidence,
    (1 - (ct.topic_embedding <=> query_embedding))::REAL AS similarity,
    ct.created_at,
    ct.resolved_at
  FROM public.conversation_threads ct
  WHERE ct.workspace_id = match_workspace_id
    AND ct.slack_user_id = match_slack_user_id
    AND ct.topic_embedding IS NOT NULL
    AND (1 - (ct.topic_embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_colleague_resolutions(
  query_embedding vector(1536),
  match_workspace_id UUID,
  exclude_slack_user_id TEXT,
  match_threshold REAL DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  topic TEXT,
  resolution_summary TEXT,
  resolution_confidence REAL,
  times_worked INT,
  times_failed INT,
  similarity REAL,
  resolved_at TIMESTAMPTZ
)
LANGUAGE sql STABLE
SET search_path = 'public'
AS $$
  SELECT
    ct.id,
    ct.topic,
    ct.resolution_summary,
    ct.resolution_confidence,
    ct.times_worked,
    ct.times_failed,
    (1 - (ct.resolution_embedding <=> query_embedding))::REAL AS similarity,
    ct.resolved_at
  FROM public.conversation_threads ct
  WHERE ct.workspace_id = match_workspace_id
    AND ct.slack_user_id != exclude_slack_user_id
    AND ct.status = 'resolved'
    AND ct.resolution_summary IS NOT NULL
    AND ct.resolution_embedding IS NOT NULL
    AND (1 - (ct.resolution_embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.count_recent_similar_issues(
  query_embedding vector(1536),
  match_workspace_id UUID,
  match_threshold REAL DEFAULT 0.65,
  hours_back INT DEFAULT 48
)
RETURNS TABLE(
  total_count BIGINT,
  unique_users BIGINT
)
LANGUAGE sql STABLE
SET search_path = 'public'
AS $$
  SELECT
    COUNT(*)::BIGINT AS total_count,
    COUNT(DISTINCT ct.slack_user_id)::BIGINT AS unique_users
  FROM public.conversation_threads ct
  WHERE ct.workspace_id = match_workspace_id
    AND ct.topic_embedding IS NOT NULL
    AND ct.created_at > now() - (hours_back || ' hours')::INTERVAL
    AND (1 - (ct.topic_embedding <=> query_embedding)) > match_threshold;
$$;
