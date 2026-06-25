-- Migration 010: Add user moderation support (suspend, ban, delete)
-- Applied: 2026-06-25
-- Purpose: Allow admin to suspend, permanently ban, or delete users with fake identities

-- Step 1: Extend registration_status to include 'suspended' and 'banned'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_registration_status_check;

ALTER TABLE users ADD CONSTRAINT users_registration_status_check
  CHECK (registration_status IN (
    'active',
    'pending_review',
    'waitlist',
    'declined',
    'suspended',
    'banned'
  ));

-- Step 2: Add moderation metadata columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS moderation_note  TEXT      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS moderated_by     INTEGER   DEFAULT NULL REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS moderated_at     TIMESTAMP DEFAULT NULL;

-- Step 3: Index for quick admin lookup of moderated users
CREATE INDEX IF NOT EXISTS idx_users_moderation_status
  ON users (registration_status)
  WHERE registration_status IN ('suspended', 'banned');
