-- =============================================================================
-- Migration 005: Health History — per-user device health timeline
--
-- Stores every scan as a snapshot (never upserted). Enables trend detection:
-- "your disk dropped 15GB in 2 weeks", "your download speed degraded", etc.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. device_health_snapshots — one row per scan, never overwritten
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  slack_user_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'web'
    CHECK (source IN ('web', 'cli', 'manual')),
  
  -- Structured fields (for quick queries)
  os_name TEXT,
  os_version TEXT,
  ram_total_gb REAL,
  cpu_cores INT,
  cpu_score INT,                        -- 0-100 benchmark score
  download_speed_mbps REAL,
  upload_speed_mbps REAL,
  latency_ms INT,
  battery_level INT,
  battery_charging BOOLEAN,
  
  -- Full raw data (everything the scan collected)
  raw_data JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for timeline queries
CREATE INDEX idx_health_snapshots_user_time 
  ON device_health_snapshots(workspace_id, slack_user_id, created_at DESC);

CREATE INDEX idx_health_snapshots_workspace
  ON device_health_snapshots(workspace_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. RPC: Get health trend for a user (compare latest vs N days ago)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_health_trend(
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
AS $$
DECLARE
  latest RECORD;
  previous RECORD;
BEGIN
  -- Get latest snapshot
  SELECT * INTO latest
  FROM device_health_snapshots
  WHERE workspace_id = match_workspace_id
    AND slack_user_id = match_slack_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF latest IS NULL THEN RETURN; END IF;
  
  -- Get snapshot from ~N days ago (closest to target date)
  SELECT * INTO previous
  FROM device_health_snapshots
  WHERE workspace_id = match_workspace_id
    AND slack_user_id = match_slack_user_id
    AND created_at < (latest.created_at - (days_back || ' days')::interval)
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF previous IS NULL THEN RETURN; END IF;
  
  -- Compare download speed
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
  
  -- Compare CPU score
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
  
  -- Compare latency
  IF latest.latency_ms IS NOT NULL AND previous.latency_ms IS NOT NULL THEN
    metric := 'latency';
    current_value := latest.latency_ms;
    previous_value := previous.latency_ms;
    change_pct := CASE WHEN previous.latency_ms > 0
      THEN ((latest.latency_ms - previous.latency_ms)::REAL / previous.latency_ms * 100)
      ELSE 0 END;
    -- For latency, LOWER is better
    direction := CASE 
      WHEN change_pct > 10 THEN 'degraded'
      WHEN change_pct < -10 THEN 'improved'
      ELSE 'stable' END;
    RETURN NEXT;
  END IF;
END;
$$;
