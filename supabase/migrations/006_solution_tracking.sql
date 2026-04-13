-- =============================================================================
-- Migration 006: Solution Effectiveness Tracking
--
-- Adds 'auto_extracted' as a valid source_type for knowledge docs,
-- allowing the bot to automatically add proven solutions to the KB.
-- =============================================================================

-- Allow auto-extracted documents in knowledge_documents
ALTER TABLE knowledge_documents 
  DROP CONSTRAINT IF EXISTS knowledge_documents_source_type_check;

ALTER TABLE knowledge_documents
  ADD CONSTRAINT knowledge_documents_source_type_check
  CHECK (source_type IN ('manual', 'url', 'file', 'auto_extracted'));

-- Index for finding auto-extracted docs by workspace
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_auto_extracted
  ON knowledge_documents(workspace_id, source_type)
  WHERE source_type = 'auto_extracted';

-- Index for confidence-based queries on conversation_threads
CREATE INDEX IF NOT EXISTS idx_threads_confidence
  ON conversation_threads(workspace_id, status, resolution_confidence)
  WHERE status = 'resolved';
