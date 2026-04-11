-- =============================================================================
-- COMBINED MIGRATION: 002 + 003
-- Resolution Engine + Command Execution
--
-- HOW TO RUN:
--   1. Go to https://supabase.com/dashboard
--   2. Select your ITSquare.AI project
--   3. Click "SQL Editor" in the left sidebar
--   4. Click "+ New query"
--   5. Paste this ENTIRE file
--   6. Click "Run" (or Ctrl+Enter)
--   7. Should see "Success. No rows returned" — that means it worked
--
-- PREREQUISITE: pgvector must already be enabled.
-- If you get an error about "vector" type not found, run this first:
--   CREATE EXTENSION IF NOT EXISTS vector;
-- =============================================================================

-- Safety: ensure pgvector is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================================
-- MIGRATION 002: Resolution Engine — Multi-Source Search
-- =====================================================================

-- ---------------------------------------------------------------------------
-- 1. Conversation Threads — tracks thread lifecycle + embeddings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  channel_id TEXT NOT NULL,
  thread_ts TEXT NOT NULL,
  slack_user_id TEXT NOT NULL,
  topic TEXT,
  topic_embedding vector(1536),
  status TEXT DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'escalated', 'stale')),
  resolution_summary TEXT,
  resolution_embedding vector(1536),
  resolution_confidence REAL DEFAULT 1.0,
  times_suggested INT DEFAULT 0,
  times_worked INT DEFAULT 0,
  times_failed INT DEFAULT 0,
  message_count INT DEFAULT 0,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, channel_id, thread_ts)
);

CREATE INDEX IF NOT EXISTS idx_threads_workspace_user
  ON conversation_threads(workspace_id, slack_user_id, status);

CREATE INDEX IF NOT EXISTS idx_threads_workspace_status
  ON conversation_threads(workspace_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_threads_workspace_open
  ON conversation_threads(workspace_id)
  WHERE status = 'open';

-- ---------------------------------------------------------------------------
-- 2. Search user's own history (Source A)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_user_history(
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
  FROM conversation_threads ct
  WHERE ct.workspace_id = match_workspace_id
    AND ct.slack_user_id = match_slack_user_id
    AND ct.topic_embedding IS NOT NULL
    AND (1 - (ct.topic_embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- ---------------------------------------------------------------------------
-- 3. Search colleague resolutions (Source B)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_colleague_resolutions(
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
  FROM conversation_threads ct
  WHERE ct.workspace_id = match_workspace_id
    AND ct.slack_user_id != exclude_slack_user_id
    AND ct.status = 'resolved'
    AND ct.resolution_summary IS NOT NULL
    AND ct.resolution_embedding IS NOT NULL
    AND (1 - (ct.resolution_embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- ---------------------------------------------------------------------------
-- 4. Detect recent similar issues (pattern detection)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION count_recent_similar_issues(
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
AS $$
  SELECT
    COUNT(*)::BIGINT AS total_count,
    COUNT(DISTINCT ct.slack_user_id)::BIGINT AS unique_users
  FROM conversation_threads ct
  WHERE ct.workspace_id = match_workspace_id
    AND ct.topic_embedding IS NOT NULL
    AND ct.created_at > now() - (hours_back || ' hours')::INTERVAL
    AND (1 - (ct.topic_embedding <=> query_embedding)) > match_threshold;
$$;

-- ---------------------------------------------------------------------------
-- 5. Device scan data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  slack_user_id TEXT NOT NULL,
  hostname TEXT,
  os_name TEXT,
  os_version TEXT,
  cpu_model TEXT,
  ram_total_gb REAL,
  ram_available_gb REAL,
  disk_total_gb REAL,
  disk_available_gb REAL,
  uptime_days REAL,
  top_processes JSONB,
  installed_software JSONB,
  raw_scan JSONB,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_scans_lookup
  ON device_scans(workspace_id, slack_user_id, scanned_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_scans_latest
  ON device_scans(workspace_id, slack_user_id);

-- ---------------------------------------------------------------------------
-- 6. Helper: increment thread message count
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_thread_message_count(thread_id UUID)
RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE conversation_threads
  SET message_count = message_count + 1,
      updated_at = now()
  WHERE id = thread_id;
$$;

-- =====================================================================
-- MIGRATION 003: Command Execution Infrastructure
-- =====================================================================

-- ---------------------------------------------------------------------------
-- 7. Execution Requests — command proposals, approvals, and results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS execution_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  thread_id UUID,
  channel_id TEXT NOT NULL,
  thread_ts TEXT NOT NULL,
  slack_user_id TEXT NOT NULL,
  commands JSONB NOT NULL,
  purpose TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown',
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'executing', 'completed', 'partial', 'rejected', 'expired')),
  approved_commands JSONB,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  results JSONB,
  completed_at TIMESTAMPTZ,
  agent_version TEXT,
  execution_mode TEXT DEFAULT 'interactive'
    CHECK (execution_mode IN ('interactive', 'review_each', 'manual')),
  action_message_ts TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 hour'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exec_workspace_user
  ON execution_requests(workspace_id, slack_user_id, status);

CREATE INDEX IF NOT EXISTS idx_exec_thread
  ON execution_requests(thread_id);

CREATE INDEX IF NOT EXISTS idx_exec_pending
  ON execution_requests(status, expires_at)
  WHERE status = 'pending';

-- =====================================================================
-- DONE! You should see "Success. No rows returned."
--
-- New tables created:
--   - conversation_threads (thread lifecycle + embeddings)
--   - device_scans (hardware/OS data per user)
--   - execution_requests (command execution workflow)
--
-- New functions created:
--   - match_user_history() — search user's past issues
--   - match_colleague_resolutions() — search org-wide solutions
--   - count_recent_similar_issues() — pattern detection
--   - increment_thread_message_count() — atomic counter
-- =====================================================================
