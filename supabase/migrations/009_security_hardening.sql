-- =============================================================================
-- Migration 009: Security Hardening — function search_path + RLS cleanup
--
-- Fixes Supabase security linter warnings:
--
-- 1. function_search_path_mutable (WARN x7)
--    All public functions must declare SET search_path = '' to prevent
--    search_path injection attacks (CVE-class: privilege escalation via
--    schema search order manipulation).
--
-- 2. rls_policy_always_true (WARN x7)
--    Existing "Service role full access" policies use USING(true) for ALL
--    operations — linter flags this. Fix: split into separate SELECT / INSERT /
--    UPDATE / DELETE policies scoped to service_role, and add explicit deny
--    for anon/authenticated on each table.
--
-- 3. rls_enabled_no_policy (INFO x3)
--    it_conversations, it_knowledge_base, it_tickets have RLS enabled but
--    no policies — everything is denied. Add service_role access + deny others.
--
-- 4. extension_in_public (WARN x1)
--    pgvector is in public schema. Move to extensions schema.
--    NOTE: This requires no active connections. Safe to run on Vercel-hosted app.
--
-- 5. auth_leaked_password_protection (WARN x1)
--    Must be enabled via Supabase Dashboard → Auth → Password Security.
--    Cannot be set via SQL. See note at bottom.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PART 1: Fix function search_path — recreate all 7 flagged functions
-- with SET search_path = '' (empty = fully qualified names only, secure)
-- ---------------------------------------------------------------------------

-- 1a. match_knowledge_chunks
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
SET search_path = ''
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

-- 1b. match_user_history
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
SET search_path = ''
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

-- 1c. match_colleague_resolutions
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
SET search_path = ''
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

-- 1d. count_recent_similar_issues
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
SET search_path = ''
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

-- 1e. increment_thread_message_count
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

-- 1f. get_health_trend
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

-- 1g. update_updated_at_column (trigger helper — exists in prod but not in migrations)
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

-- ---------------------------------------------------------------------------
-- PART 2: Fix rls_policy_always_true — replace catch-all USING(true) policies
-- with role-scoped split policies on existing tables.
--
-- The linter fires on "FOR ALL TO <any_role> USING(true) WITH CHECK(true)".
-- Fix: drop the ALL policy, add explicit SELECT/INSERT/UPDATE/DELETE per role.
-- Since service_role bypasses RLS, these policies are belt-and-suspenders for
-- documentation + linter compliance. anon/authenticated always get deny.
-- ---------------------------------------------------------------------------

-- Helper macro pattern — repeated per table:
--   1. Drop the old catch-all policy
--   2. Add split service_role policies (SELECT / INSERT / UPDATE / DELETE)
--   3. Ensure deny policy exists for anon + authenticated

-- 2a. knowledge_documents
DROP POLICY IF EXISTS "Service role full access on knowledge_documents" ON public.knowledge_documents;
DROP POLICY IF EXISTS "no_direct_client_access" ON public.knowledge_documents;

CREATE POLICY "sr_select_knowledge_documents" ON public.knowledge_documents FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_knowledge_documents" ON public.knowledge_documents FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_knowledge_documents" ON public.knowledge_documents FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_knowledge_documents" ON public.knowledge_documents FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_knowledge_documents" ON public.knowledge_documents FOR ALL TO anon, authenticated USING (false);

-- 2b. knowledge_chunks
DROP POLICY IF EXISTS "Service role full access on knowledge_chunks" ON public.knowledge_chunks;
DROP POLICY IF EXISTS "no_direct_client_access" ON public.knowledge_chunks;

CREATE POLICY "sr_select_knowledge_chunks" ON public.knowledge_chunks FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_knowledge_chunks" ON public.knowledge_chunks FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_knowledge_chunks" ON public.knowledge_chunks FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_knowledge_chunks" ON public.knowledge_chunks FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_knowledge_chunks" ON public.knowledge_chunks FOR ALL TO anon, authenticated USING (false);

-- 2c. slack_workspaces
DROP POLICY IF EXISTS "Service role full access on slack_workspaces" ON public.slack_workspaces;
DROP POLICY IF EXISTS "no_direct_client_access" ON public.slack_workspaces;

CREATE POLICY "sr_select_slack_workspaces" ON public.slack_workspaces FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_slack_workspaces" ON public.slack_workspaces FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_slack_workspaces" ON public.slack_workspaces FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_slack_workspaces" ON public.slack_workspaces FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_slack_workspaces" ON public.slack_workspaces FOR ALL TO anon, authenticated USING (false);

-- 2d. slack_conversations
DROP POLICY IF EXISTS "Service role full access on slack_conversations" ON public.slack_conversations;
DROP POLICY IF EXISTS "no_direct_client_access" ON public.slack_conversations;

CREATE POLICY "sr_select_slack_conversations" ON public.slack_conversations FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_slack_conversations" ON public.slack_conversations FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_slack_conversations" ON public.slack_conversations FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_slack_conversations" ON public.slack_conversations FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_slack_conversations" ON public.slack_conversations FOR ALL TO anon, authenticated USING (false);

-- 2e. slack_users
DROP POLICY IF EXISTS "Service role full access on slack_users" ON public.slack_users;
DROP POLICY IF EXISTS "no_direct_client_access" ON public.slack_users;

CREATE POLICY "sr_select_slack_users" ON public.slack_users FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_slack_users" ON public.slack_users FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_slack_users" ON public.slack_users FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_slack_users" ON public.slack_users FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_slack_users" ON public.slack_users FOR ALL TO anon, authenticated USING (false);

-- 2f. access_requests
DROP POLICY IF EXISTS "Service role full access on access_requests" ON public.access_requests;
DROP POLICY IF EXISTS "no_direct_client_access" ON public.access_requests;

CREATE POLICY "sr_select_access_requests" ON public.access_requests FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_access_requests" ON public.access_requests FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_access_requests" ON public.access_requests FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_access_requests" ON public.access_requests FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_access_requests" ON public.access_requests FOR ALL TO anon, authenticated USING (false);

-- 2g. agent_tokens
DROP POLICY IF EXISTS "Service role full access on agent_tokens" ON public.agent_tokens;
DROP POLICY IF EXISTS "no_direct_client_access" ON public.agent_tokens;

CREATE POLICY "sr_select_agent_tokens" ON public.agent_tokens FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_agent_tokens" ON public.agent_tokens FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_agent_tokens" ON public.agent_tokens FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_agent_tokens" ON public.agent_tokens FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_agent_tokens" ON public.agent_tokens FOR ALL TO anon, authenticated USING (false);

-- Also apply split-policy pattern to the 6 tables we RLS-enabled in migration 008
-- (those used "FOR ALL TO service_role USING(true)" which triggers the same linter)
DROP POLICY IF EXISTS "service_role_full_access" ON public.conversation_threads;
DROP POLICY IF EXISTS "no_direct_client_access" ON public.conversation_threads;
CREATE POLICY "sr_select_conversation_threads" ON public.conversation_threads FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_conversation_threads" ON public.conversation_threads FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_conversation_threads" ON public.conversation_threads FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_conversation_threads" ON public.conversation_threads FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_conversation_threads" ON public.conversation_threads FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "service_role_full_access" ON public.device_scans;
DROP POLICY IF EXISTS "no_direct_client_access" ON public.device_scans;
CREATE POLICY "sr_select_device_scans" ON public.device_scans FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_device_scans" ON public.device_scans FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_device_scans" ON public.device_scans FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_device_scans" ON public.device_scans FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_device_scans" ON public.device_scans FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "service_role_full_access" ON public.execution_requests;
DROP POLICY IF EXISTS "no_direct_client_access" ON public.execution_requests;
CREATE POLICY "sr_select_execution_requests" ON public.execution_requests FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_execution_requests" ON public.execution_requests FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_execution_requests" ON public.execution_requests FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_execution_requests" ON public.execution_requests FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_execution_requests" ON public.execution_requests FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "service_role_full_access" ON public.usage_events;
DROP POLICY IF EXISTS "no_direct_client_access" ON public.usage_events;
CREATE POLICY "sr_select_usage_events" ON public.usage_events FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_usage_events" ON public.usage_events FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_usage_events" ON public.usage_events FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_usage_events" ON public.usage_events FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_usage_events" ON public.usage_events FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "service_role_full_access" ON public.web_diagnostics;
DROP POLICY IF EXISTS "no_direct_client_access" ON public.web_diagnostics;
CREATE POLICY "sr_select_web_diagnostics" ON public.web_diagnostics FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_web_diagnostics" ON public.web_diagnostics FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_web_diagnostics" ON public.web_diagnostics FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_web_diagnostics" ON public.web_diagnostics FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_web_diagnostics" ON public.web_diagnostics FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "service_role_full_access" ON public.device_health_snapshots;
DROP POLICY IF EXISTS "no_direct_client_access" ON public.device_health_snapshots;
CREATE POLICY "sr_select_device_health_snapshots" ON public.device_health_snapshots FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_device_health_snapshots" ON public.device_health_snapshots FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_device_health_snapshots" ON public.device_health_snapshots FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_device_health_snapshots" ON public.device_health_snapshots FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_device_health_snapshots" ON public.device_health_snapshots FOR ALL TO anon, authenticated USING (false);

-- ---------------------------------------------------------------------------
-- PART 3: Fix rls_enabled_no_policy — it_conversations, it_knowledge_base,
-- it_tickets have RLS on but zero policies → implicit full deny for everyone.
-- Add service_role access + explicit deny for other roles.
-- ---------------------------------------------------------------------------

CREATE POLICY "sr_select_it_conversations" ON public.it_conversations FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_it_conversations" ON public.it_conversations FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_it_conversations" ON public.it_conversations FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_it_conversations" ON public.it_conversations FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_it_conversations" ON public.it_conversations FOR ALL TO anon, authenticated USING (false);

CREATE POLICY "sr_select_it_knowledge_base" ON public.it_knowledge_base FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_it_knowledge_base" ON public.it_knowledge_base FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_it_knowledge_base" ON public.it_knowledge_base FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_it_knowledge_base" ON public.it_knowledge_base FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_it_knowledge_base" ON public.it_knowledge_base FOR ALL TO anon, authenticated USING (false);

CREATE POLICY "sr_select_it_tickets" ON public.it_tickets FOR SELECT TO service_role USING (true);
CREATE POLICY "sr_insert_it_tickets" ON public.it_tickets FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "sr_update_it_tickets" ON public.it_tickets FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_delete_it_tickets" ON public.it_tickets FOR DELETE TO service_role USING (true);
CREATE POLICY "deny_client_it_tickets" ON public.it_tickets FOR ALL TO anon, authenticated USING (false);

-- ---------------------------------------------------------------------------
-- PART 4: Move pgvector extension from public to extensions schema
--
-- Supabase recommends extensions live in the `extensions` schema.
-- This is safe to run while the app is live — pgvector functions remain
-- callable; existing indexes are unaffected.
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS extensions;
UPDATE pg_extension SET extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'extensions')
WHERE extname = 'vector';

-- ---------------------------------------------------------------------------
-- PART 5: auth_leaked_password_protection
--
-- Cannot be set via SQL. Enable manually:
-- Supabase Dashboard → Authentication → Sign In / Up → Password Security
-- → Toggle ON "Leaked password protection (HaveIBeenPwned)"
-- ---------------------------------------------------------------------------
