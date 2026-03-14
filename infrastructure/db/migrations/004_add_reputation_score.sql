-- Add reputation_score to company_profiles table
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS reputation_score INTEGER NOT NULL DEFAULT 100
    CHECK (reputation_score >= 0 AND reputation_score <= 100);

CREATE INDEX IF NOT EXISTS idx_company_profiles_reputation_score
  ON company_profiles(reputation_score);
