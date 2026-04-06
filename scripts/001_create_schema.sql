-- ITSquare.AI Database Schema
-- Organizations, Users, Integrations, Scans, Findings, Benchmarks

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (your customers)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  employee_count_range TEXT, -- '1-50', '51-200', '201-500', '501-1000', '1000+'
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'starter', 'growth', 'enterprise'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users (people who log in to your app)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin', -- 'owner', 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Connected integrations (Okta, Google Workspace)
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'okta', 'google_workspace'
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  domain TEXT, -- e.g., 'acme.okta.com' or 'acme.com'
  scopes TEXT[],
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'revoked', 'error'
  last_sync_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, provider)
);

-- Scan results
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  trigger_type TEXT DEFAULT 'manual', -- 'manual', 'scheduled', 'onboarding'
  
  -- Raw findings counts
  total_users INT DEFAULT 0,
  dormant_accounts INT DEFAULT 0,       -- no login > 90 days
  no_mfa_accounts INT DEFAULT 0,
  over_privileged_accounts INT DEFAULT 0,
  shared_accounts INT DEFAULT 0,
  external_accounts INT DEFAULT 0,
  unused_licenses INT DEFAULT 0,
  
  -- Computed scores (0-100)
  overall_score INT,
  access_hygiene_score INT,
  mfa_coverage_score INT,
  license_efficiency_score INT,
  privilege_score INT,
  
  -- Benchmark percentiles (populated after enough data)
  benchmark_percentile INT,    -- where they rank vs peers
  industry_benchmark_percentile INT,
  
  -- AI analysis
  ai_summary TEXT,             -- natural language risk narrative
  ai_recommendations JSONB,   -- structured recommendations array
  
  -- Report
  report_pdf_url TEXT,
  
  -- Error tracking
  error_message TEXT,
  error_code TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual findings (the detailed rows)
CREATE TABLE IF NOT EXISTS findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'dormant', 'no_mfa', 'over_privileged', 'shared', 'external', 'unused_license'
  severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low', 'info'
  user_email TEXT,
  user_name TEXT,
  detail JSONB,           -- flexible: last_login, apps_assigned, role, permissions, etc.
  source TEXT NOT NULL,   -- 'okta', 'google_workspace'
  remediation_status TEXT DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'ignored'
  remediated_at TIMESTAMPTZ,
  remediated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Anonymized benchmark data (your moat)
CREATE TABLE IF NOT EXISTS benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry TEXT,
  employee_count_range TEXT,
  metric TEXT NOT NULL,      -- 'dormant_rate', 'mfa_coverage', 'admin_ratio', 'overall_score'
  value NUMERIC NOT NULL,
  scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scan progress events (for real-time updates)
CREATE TABLE IF NOT EXISTS scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'started', 'fetching_okta', 'fetching_google', 'analyzing', 'generating_report', 'completed', 'failed'
  message TEXT,
  progress_percent INT, -- 0-100
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_integrations_org ON integrations(org_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(org_id, provider);
CREATE INDEX IF NOT EXISTS idx_scans_org ON scans(org_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_findings_scan ON findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_findings_category ON findings(category);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_benchmarks_lookup ON benchmarks(industry, employee_count_range, metric);
CREATE INDEX IF NOT EXISTS idx_scan_events_scan ON scan_events(scan_id);

-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
-- Users can only see their own organization
CREATE POLICY "users_view_own_org" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "users_update_own_org" ON organizations
  FOR UPDATE USING (
    id IN (SELECT org_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- RLS Policies for users table
CREATE POLICY "users_view_own_profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_view_org_members" ON users
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for integrations
-- Users can view/manage integrations for their organization
CREATE POLICY "integrations_view_org" ON integrations
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "integrations_insert_org" ON integrations
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "integrations_update_org" ON integrations
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "integrations_delete_org" ON integrations
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- RLS Policies for scans
CREATE POLICY "scans_view_org" ON scans
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "scans_insert_org" ON scans
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "scans_update_org" ON scans
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- RLS Policies for findings
CREATE POLICY "findings_view_org" ON findings
  FOR SELECT USING (
    scan_id IN (
      SELECT s.id FROM scans s
      JOIN users u ON s.org_id = u.org_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "findings_update_org" ON findings
  FOR UPDATE USING (
    scan_id IN (
      SELECT s.id FROM scans s
      JOIN users u ON s.org_id = u.org_id
      WHERE u.id = auth.uid()
    )
  );

-- RLS Policies for benchmarks (read-only for aggregated stats)
CREATE POLICY "benchmarks_view_all" ON benchmarks
  FOR SELECT USING (true);

-- RLS Policies for scan_events
CREATE POLICY "scan_events_view_org" ON scan_events
  FOR SELECT USING (
    scan_id IN (
      SELECT s.id FROM scans s
      JOIN users u ON s.org_id = u.org_id
      WHERE u.id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scans_updated_at
  BEFORE UPDATE ON scans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
