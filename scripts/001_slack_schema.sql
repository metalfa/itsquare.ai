-- ITSquare.AI Slack Integration Schema
-- This migration creates tables for Slack workspaces, users, device scans, and agent tokens

-- Slack Workspaces (installed Slack teams)
CREATE TABLE IF NOT EXISTS slack_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT UNIQUE NOT NULL,              -- Slack team ID (T01234567)
  team_name TEXT NOT NULL,
  team_domain TEXT,                           -- workspace.slack.com
  bot_token_encrypted TEXT NOT NULL,          -- xoxb-... encrypted
  bot_user_id TEXT NOT NULL,                  -- Bot's Slack user ID
  installed_by_slack_user_id TEXT NOT NULL,   -- Who installed the app
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL, -- Link to ITSquare org
  scopes TEXT[],                              -- OAuth scopes granted
  is_enterprise BOOLEAN DEFAULT FALSE,
  enterprise_id TEXT,                         -- For Enterprise Grid
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'error')),
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slack Users (users who interact with the bot)
CREATE TABLE IF NOT EXISTS slack_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,
  slack_user_id TEXT NOT NULL,                -- Slack user ID (U01234567)
  slack_username TEXT,
  display_name TEXT,
  email TEXT,                                 -- May be null if not shared
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_owner BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to ITSquare user
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, slack_user_id)
);

-- Agent Tokens (for device scan CLI)
CREATE TABLE IF NOT EXISTS agent_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT UNIQUE NOT NULL,            -- SHA-256 hash of the token
  token_prefix TEXT NOT NULL,                 -- First 8 chars for identification
  workspace_id UUID REFERENCES slack_workspaces(id) ON DELETE CASCADE,
  slack_user_id UUID REFERENCES slack_users(id) ON DELETE CASCADE,
  name TEXT,                                  -- Friendly name (e.g., "John's MacBook")
  device_identifier TEXT,                     -- Hardware ID from first scan
  scopes TEXT[] DEFAULT ARRAY['device:scan'],
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                     -- Optional expiration
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device Scans (results from CLI agent)
CREATE TABLE IF NOT EXISTS device_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_token_id UUID NOT NULL REFERENCES agent_tokens(id) ON DELETE CASCADE,
  slack_user_id UUID REFERENCES slack_users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES slack_workspaces(id) ON DELETE CASCADE,
  
  -- Device identification
  device_id TEXT,                             -- Unique device identifier
  hostname TEXT,
  os_type TEXT CHECK (os_type IN ('macos', 'windows', 'linux')),
  os_version TEXT,
  os_build TEXT,
  
  -- Hardware info
  cpu_model TEXT,
  cpu_cores INTEGER,
  ram_total_gb NUMERIC(10,2),
  disk_total_gb NUMERIC(10,2),
  disk_free_gb NUMERIC(10,2),
  
  -- Security status
  firewall_enabled BOOLEAN,
  filevault_enabled BOOLEAN,                  -- macOS disk encryption
  bitlocker_enabled BOOLEAN,                  -- Windows disk encryption
  gatekeeper_enabled BOOLEAN,                 -- macOS app signing
  sip_enabled BOOLEAN,                        -- macOS System Integrity Protection
  secure_boot_enabled BOOLEAN,                -- Windows/Linux
  antivirus_installed BOOLEAN,
  antivirus_name TEXT,
  antivirus_up_to_date BOOLEAN,
  
  -- Software updates
  os_up_to_date BOOLEAN,
  pending_updates INTEGER DEFAULT 0,
  last_update_check TIMESTAMPTZ,
  
  -- Browser extensions (JSONB array)
  browser_extensions JSONB,                   -- [{browser, name, version, risk_level}]
  
  -- Installed apps (JSONB array of notable/risky apps)
  installed_apps JSONB,                       -- [{name, version, publisher, risk_level}]
  
  -- Network info
  wifi_security_type TEXT,                    -- WPA3, WPA2, Open, etc.
  vpn_connected BOOLEAN,
  
  -- Health scores (calculated)
  security_score INTEGER CHECK (security_score >= 0 AND security_score <= 100),
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
  overall_health_score INTEGER CHECK (overall_health_score >= 0 AND overall_health_score <= 100),
  
  -- Issues found (JSONB array)
  issues JSONB,                               -- [{category, severity, title, description, remediation}]
  issue_count_critical INTEGER DEFAULT 0,
  issue_count_high INTEGER DEFAULT 0,
  issue_count_medium INTEGER DEFAULT 0,
  issue_count_low INTEGER DEFAULT 0,
  
  -- AI summary
  ai_summary TEXT,
  ai_recommendations JSONB,
  
  -- Metadata
  scan_duration_ms INTEGER,
  agent_version TEXT,
  raw_scan_data JSONB,                        -- Full scan payload for debugging
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slack Conversations (for context in AI responses)
CREATE TABLE IF NOT EXISTS slack_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,
  slack_user_id UUID NOT NULL REFERENCES slack_users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,                   -- Slack channel/DM ID
  thread_ts TEXT,                             -- Thread timestamp (for thread replies)
  message_role TEXT NOT NULL CHECK (message_role IN ('user', 'assistant', 'system')),
  message_content TEXT NOT NULL,
  message_ts TEXT,                            -- Slack message timestamp
  metadata JSONB,                             -- Extra context (device scan refs, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access Requests (for Phase 4, but creating schema now)
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,
  requester_slack_user_id UUID NOT NULL REFERENCES slack_users(id) ON DELETE CASCADE,
  
  -- What they're requesting
  app_name TEXT NOT NULL,                     -- e.g., "Figma", "GitHub", "Salesforce"
  app_icon_url TEXT,
  reason TEXT,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
  
  -- Approval workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'provisioned', 'expired')),
  approver_slack_user_id UUID REFERENCES slack_users(id),
  approval_message_ts TEXT,                   -- Slack message ID for the approval request
  approval_channel_id TEXT,                   -- Channel where approval was requested
  
  -- Provisioning
  provisioned_via TEXT,                       -- 'okta', 'google_workspace', 'manual'
  provisioned_at TIMESTAMPTZ,
  
  -- Timing
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                     -- For temporary access
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_slack_workspaces_team_id ON slack_workspaces(team_id);
CREATE INDEX IF NOT EXISTS idx_slack_workspaces_org_id ON slack_workspaces(org_id);
CREATE INDEX IF NOT EXISTS idx_slack_users_workspace_slack ON slack_users(workspace_id, slack_user_id);
CREATE INDEX IF NOT EXISTS idx_slack_users_email ON slack_users(email);
CREATE INDEX IF NOT EXISTS idx_agent_tokens_hash ON agent_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_agent_tokens_workspace ON agent_tokens(workspace_id);
CREATE INDEX IF NOT EXISTS idx_device_scans_agent ON device_scans(agent_token_id);
CREATE INDEX IF NOT EXISTS idx_device_scans_workspace ON device_scans(workspace_id);
CREATE INDEX IF NOT EXISTS idx_device_scans_created ON device_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slack_conversations_user ON slack_conversations(slack_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_workspace ON access_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);

-- Enable Row Level Security
ALTER TABLE slack_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role can do everything (for API routes using service role key)
-- For user-facing queries, we'll use the service role in API routes

CREATE POLICY "Service role full access on slack_workspaces" ON slack_workspaces
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on slack_users" ON slack_users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on agent_tokens" ON agent_tokens
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on device_scans" ON device_scans
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on slack_conversations" ON slack_conversations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on access_requests" ON access_requests
  FOR ALL USING (true) WITH CHECK (true);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_slack_workspaces_updated_at ON slack_workspaces;
CREATE TRIGGER update_slack_workspaces_updated_at BEFORE UPDATE ON slack_workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_slack_users_updated_at ON slack_users;
CREATE TRIGGER update_slack_users_updated_at BEFORE UPDATE ON slack_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_access_requests_updated_at ON access_requests;
CREATE TRIGGER update_access_requests_updated_at BEFORE UPDATE ON access_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
