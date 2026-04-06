-- Add scan_events table for tracking scan progress and history
-- This table stores events during scan execution for real-time progress updates

CREATE TABLE IF NOT EXISTS public.scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('started', 'progress', 'completed', 'failed', 'finding_detected')),
  message TEXT,
  progress_percent INTEGER CHECK (progress_percent >= 0 AND progress_percent <= 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient event lookups by scan
CREATE INDEX IF NOT EXISTS idx_scan_events_scan_id ON public.scan_events(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_created_at ON public.scan_events(created_at);

-- Enable RLS
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only view events for scans in their organization
CREATE POLICY "Users can view scan events in their organization" ON public.scan_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scans s
      JOIN public.users u ON u.org_id = s.org_id
      WHERE s.id = scan_events.scan_id
      AND u.id = auth.uid()
    )
  );

-- Service role can insert events (for backend scan jobs)
CREATE POLICY "Service role can insert scan events" ON public.scan_events
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.scan_events TO authenticated;
GRANT INSERT ON public.scan_events TO service_role;
