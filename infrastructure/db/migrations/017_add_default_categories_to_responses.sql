-- Migration 017: Add default_categories to incident_responses
-- When a company responds to an incident (via My Defaults page),
-- they can select one or more categories explaining why payment was stopped.
-- Stored as a PostgreSQL TEXT[] array for flexibility.

ALTER TABLE incident_responses
  ADD COLUMN IF NOT EXISTS default_categories TEXT[] DEFAULT '{}';

COMMENT ON COLUMN incident_responses.default_categories IS
  'Checklist of reasons the accused company selects to explain the payment default';
