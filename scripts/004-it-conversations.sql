-- IT Conversations table for storing chat history
CREATE TABLE IF NOT EXISTS it_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT UNIQUE NOT NULL,
  workspace_id UUID REFERENCES slack_workspaces(id) ON DELETE CASCADE,
  slack_user_id UUID REFERENCES slack_users(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IT Tickets table for tracking issues and resolutions
CREATE TABLE IF NOT EXISTS it_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES slack_workspaces(id) ON DELETE CASCADE,
  slack_user_id UUID REFERENCES slack_users(id) ON DELETE CASCADE,
  issue_description TEXT NOT NULL,
  ai_response TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved_by_ai', 'escalated', 'resolved_by_human', 'closed')),
  assigned_to UUID REFERENCES slack_users(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_it_conversations_workspace ON it_conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_it_conversations_user ON it_conversations(slack_user_id);
CREATE INDEX IF NOT EXISTS idx_it_tickets_workspace ON it_tickets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_it_tickets_user ON it_tickets(slack_user_id);
CREATE INDEX IF NOT EXISTS idx_it_tickets_status ON it_tickets(status);

-- Enable RLS
ALTER TABLE it_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_tickets ENABLE ROW LEVEL SECURITY;

-- Policies for service role access
CREATE POLICY "Service role full access to conversations" ON it_conversations
  FOR ALL USING (true);

CREATE POLICY "Service role full access to tickets" ON it_tickets
  FOR ALL USING (true);
