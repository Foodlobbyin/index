-- Migration 009: Rename user_searches table to search_logs and enhance schema
-- This migration aligns the search logging table with the SearchService implementation
-- Author: AI Assistant
-- Date: 2026-03-28

-- Rename table from user_searches to search_logs for better semantic clarity
ALTER TABLE user_searches RENAME TO search_logs;

-- Rename column 'query' to 'search_value' for consistency with SearchService
ALTER TABLE search_logs RENAME COLUMN query TO search_value;

-- Rename column 'searched_at' to 'created_at' for consistency
ALTER TABLE search_logs RENAME COLUMN searched_at TO created_at;

-- Add search_type column to distinguish between GSTN and mobile searches
ALTER TABLE search_logs 
  ADD COLUMN IF NOT EXISTS search_type VARCHAR(20) NOT NULL DEFAULT 'gstn' 
  CHECK (search_type IN ('gstn', 'mobile'));

-- Update indexes to use new table name
DROP INDEX IF EXISTS idx_user_searches_user_id;
DROP INDEX IF EXISTS idx_user_searches_searched_at;

CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_type ON search_logs(search_type);

-- Create composite index for rate limiting queries (user_id + created_at)
CREATE INDEX IF NOT EXISTS idx_search_logs_user_time ON search_logs(user_id, created_at DESC);

-- Add comment to table
COMMENT ON TABLE search_logs IS 'Audit log of all GSTN and mobile searches performed by users. Used for rate limiting (100 searches per hour) and analytics.';

COMMENT ON COLUMN search_logs.search_type IS 'Type of search performed: gstn or mobile';
COMMENT ON COLUMN search_logs.search_value IS 'The actual GSTN number or mobile number that was searched';
COMMENT ON COLUMN search_logs.created_at IS 'Timestamp when the search was performed (used for rate limit calculations)';
