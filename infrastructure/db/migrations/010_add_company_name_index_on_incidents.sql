-- Migration 010: Add case-insensitive trigram index on incidents.company_name
-- Required for efficient name-based reputation lookups for non-GSTN companies.
--
-- Uses pg_trgm extension for ILIKE searches.
-- Falls back gracefully if pg_trgm is unavailable (plain B-tree index still helps
-- with exact-match lookups).

-- Enable the trigram extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram index for fast ILIKE / similarity queries on company_name
CREATE INDEX IF NOT EXISTS idx_incidents_company_name_trgm
  ON incidents USING GIN (company_name gin_trgm_ops);

-- Plain lower-cased functional index for exact case-insensitive matching
CREATE INDEX IF NOT EXISTS idx_incidents_company_name_lower
  ON incidents (LOWER(company_name));
