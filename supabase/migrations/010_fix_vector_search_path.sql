-- =============================================================================
-- Migration 010: Fix vector operator breakage from migration 009
--
-- Root cause: Setting search_path = '' on functions that use the pgvector <=>
-- operator breaks operator resolution. Postgres can't find `<=>` when the
-- search_path is empty, even if vector is in public schema.
--
-- Additionally, migration 009 attempted to move the vector extension from
-- public to extensions schema — this breaks ALL vector operators app-wide
-- and is not worth the linter WARN. Reverting that move.
--
-- Fix:
--   1. Move vector extension back to public schema (restore working state)
--   2. Recreate vector functions with search_path = 'public, extensions'
--      so operators are always found regardless of extension location
--   3. Non-vector functions keep search_path = '' (fully safe, no operators needed)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PART 1: Restore vector extension to public schema
-- (undo the migration 009 extension move that broke operators)
-- ---------------------------------------------------------------------------
UPDATE pg_extension
  SET extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  WHERE extname = 'vector';

-- ---------------------------------------------------------------------------
-- PART 2: Recreate vector-using functions with correct search_path
-- search_path = 'public, extensions' ensures <=> operator is always found
-- ---------------------------------------------------------------------------

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
SET search_path = 'public, extensions'
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
SET search_path = 'public, extensions'
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
SET search_path = 'public, extensions'
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
SET search_path = 'public, extensions'
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

-- ---------------------------------------------------------------------------
-- PART 3: Non-vector functions — safe to keep search_path = ''
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_thread_message_count(thread_id UUID)
RETURNS VOID
LANGUAGE sql
SET search_path = ''
AS $$
  UPDATE public.conversation_threads
  SET message_count = message_count + 1,
      updated_at = now()
  WHERE id = thread_id;
$$;

CREATE OR REPLACE FUNCTION public.get_health_trend(
  match_workspace_id UUID,
  match_slack_user_id TEXT,
  days_back INT DEFAULT 7
)
RETURNS TABLE(
  metric TEXT,
  current_value REAL,
  previous_value REAL,
  change_pct REAL,
  direction TEXT
)
LANGUAGE plpgsql STABLE
SET search_path = ''
AS $$
DECLARE
  latest RECORD;
  previous RECORD;
BEGIN
  SELECT * INTO latest
  FROM public.device_health_snapshots
  WHERE workspace_id = match_workspace_id
    AND slack_user_id = match_slack_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF latest IS NULL THEN RETURN; END IF;

  SELECT * INTO previous
  FROM public.device_health_snapshots
  WHERE workspace_id = match_workspace_id
    AND slack_user_id = match_slack_user_id
    AND created_at < (latest.created_at - (days_back || ' days')::interval)
  ORDER BY created_at DESC
  LIMIT 1;

  IF previous IS NULL THEN RETURN; END IF;

  IF latest.download_speed_mbps IS NOT NULL AND previous.download_speed_mbps IS NOT NULL THEN
    metric := 'download_speed';
    current_value := latest.download_speed_mbps;
    previous_value := previous.download_speed_mbps;
    change_pct := CASE WHEN previous.download_speed_mbps > 0
      THEN ((latest.download_speed_mbps - previous.download_speed_mbps) / previous.download_speed_mbps * 100)
      ELSE 0 END;
    direction := CASE
      WHEN change_pct > 10 THEN 'improved'
      WHEN change_pct < -10 THEN 'degraded'
      ELSE 'stable' END;
    RETURN NEXT;
  END IF;

  IF latest.cpu_score IS NOT NULL AND previous.cpu_score IS NOT NULL THEN
    metric := 'cpu_score';
    current_value := latest.cpu_score;
    previous_value := previous.cpu_score;
    change_pct := CASE WHEN previous.cpu_score > 0
      THEN ((latest.cpu_score - previous.cpu_score)::REAL / previous.cpu_score * 100)
      ELSE 0 END;
    direction := CASE
      WHEN change_pct > 10 THEN 'improved'
      WHEN change_pct < -10 THEN 'degraded'
      ELSE 'stable' END;
    RETURN NEXT;
  END IF;

  IF latest.latency_ms IS NOT NULL AND previous.latency_ms IS NOT NULL THEN
    metric := 'latency';
    current_value := latest.latency_ms;
    previous_value := previous.latency_ms;
    change_pct := CASE WHEN previous.latency_ms > 0
      THEN ((latest.latency_ms - previous.latency_ms)::REAL / previous.latency_ms * 100)
      ELSE 0 END;
    direction := CASE
      WHEN change_pct > 10 THEN 'degraded'
      WHEN change_pct < -10 THEN 'improved'
      ELSE 'stable' END;
    RETURN NEXT;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
