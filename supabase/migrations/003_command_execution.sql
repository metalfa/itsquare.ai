-- =============================================================================
-- Migration 003: Command Execution Infrastructure
--
-- Adds the execution_requests table, interactive message tracking,
-- and the foundation for the CLI agent → Slack bot → AI loop.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Execution Requests — tracks command proposals, approvals, and results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS execution_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  thread_id UUID,                           -- links to conversation_threads
  channel_id TEXT NOT NULL,
  thread_ts TEXT NOT NULL,                   -- Slack thread for status updates
  slack_user_id TEXT NOT NULL,

  -- What the AI wants to run
  commands JSONB NOT NULL,                   -- [{cmd, tier, explanation, platform}]
  purpose TEXT NOT NULL,                     -- "Network diagnostics for slow internet"
  platform TEXT NOT NULL DEFAULT 'unknown',  -- darwin, win32, linux

  -- Approval workflow
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'executing', 'completed', 'partial', 'rejected', 'expired')),
  approved_commands JSONB,                   -- which specific commands were approved (for review-each mode)
  approved_by TEXT,                          -- slack user ID who approved
  approved_at TIMESTAMPTZ,

  -- Execution results
  results JSONB,                             -- [{cmd, stdout, stderr, exitCode, tier, executedAt}]
  completed_at TIMESTAMPTZ,

  -- Agent metadata
  agent_version TEXT,
  execution_mode TEXT DEFAULT 'interactive'  -- 'interactive' | 'review_each' | 'manual'
    CHECK (execution_mode IN ('interactive', 'review_each', 'manual')),

  -- Slack message tracking (for updating buttons after action)
  action_message_ts TEXT,                    -- the message with the buttons
  
  -- Expiry: commands expire after 1 hour if not approved
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 hour'),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_exec_workspace_user ON execution_requests(workspace_id, slack_user_id, status);
CREATE INDEX idx_exec_thread ON execution_requests(thread_id);
CREATE INDEX idx_exec_pending ON execution_requests(status, expires_at) WHERE status = 'pending';
