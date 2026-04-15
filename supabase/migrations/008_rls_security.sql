-- =============================================================================
-- Migration 008: Row Level Security — enable RLS on all public tables
-- that were flagged by Supabase security linter.
--
-- Access pattern:
--   All 6 tables are ONLY accessed via the service_role client (createAdminClient).
--   The service_role bypasses RLS by default in Supabase, so existing API code
--   continues to work without any changes.
--
--   We enable RLS to close off direct anon/authenticated client access, and add
--   explicit service_role policies for clarity + compliance.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. conversation_threads
-- ---------------------------------------------------------------------------
ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;

-- Service role has full access (belt-and-suspenders — it bypasses RLS anyway)
CREATE POLICY "service_role_full_access" ON conversation_threads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Deny all direct client access (anon + authenticated users go through API only)
CREATE POLICY "no_direct_client_access" ON conversation_threads
  FOR ALL
  TO anon, authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- 2. device_scans
-- ---------------------------------------------------------------------------
ALTER TABLE device_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON device_scans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "no_direct_client_access" ON device_scans
  FOR ALL
  TO anon, authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- 3. execution_requests
-- ---------------------------------------------------------------------------
ALTER TABLE execution_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON execution_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "no_direct_client_access" ON execution_requests
  FOR ALL
  TO anon, authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- 4. usage_events
-- ---------------------------------------------------------------------------
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON usage_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "no_direct_client_access" ON usage_events
  FOR ALL
  TO anon, authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- 5. web_diagnostics  (also contains sensitive `token` column)
-- ---------------------------------------------------------------------------
ALTER TABLE web_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON web_diagnostics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "no_direct_client_access" ON web_diagnostics
  FOR ALL
  TO anon, authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- 6. device_health_snapshots
-- ---------------------------------------------------------------------------
ALTER TABLE device_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON device_health_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "no_direct_client_access" ON device_health_snapshots
  FOR ALL
  TO anon, authenticated
  USING (false);
