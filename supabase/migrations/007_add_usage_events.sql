-- Usage events table for tracking per-workspace message/event usage
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  slack_user_id TEXT,
  event_type TEXT NOT NULL DEFAULT 'message',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_workspace_month
  ON usage_events (workspace_id, created_at);
