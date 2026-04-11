-- =============================================================================
-- Migration 004: Web Diagnostics — one-click browser-based device scanning
-- =============================================================================

CREATE TABLE IF NOT EXISTS web_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  slack_user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  thread_ts TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,          -- unique URL token for /check/<token>
  issue_type TEXT DEFAULT 'general',   -- performance, network, security
  device_data JSONB,                   -- browser-collected device info
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'expired')),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 hour'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_web_diag_token ON web_diagnostics(token, status);
CREATE INDEX idx_web_diag_user ON web_diagnostics(workspace_id, slack_user_id);
