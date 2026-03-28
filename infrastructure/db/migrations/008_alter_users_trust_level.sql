-- ============================================================
-- Migration: 008_alter_users_trust_level.sql
-- Description: Add trust-level and privacy columns to the
--              users table, required by the Incidents System.
-- Depends on:  000_base_schema.sql (users table must exist)
-- Checklist:   IMPLEMENTATION_CHECKLIST.md Phase 1 § 1.1
--              'Run ALTER TABLE users ADD COLUMN trust_level'
-- Author:      Foodlobbyin
-- Date:        2026-03-28
-- ============================================================

-- ============================================================
-- 1. trust_level
-- 5-tier trust system that controls what a user can do:
--   basic      - newly registered, unverified user
--   verified   - email/mobile verified user
--   trusted    - promoted after 3+ approved incident reports
--   moderator  - can approve/reject incidents & responses
--   admin      - full platform access
-- ============================================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS trust_level VARCHAR(20)
        NOT NULL
        DEFAULT 'basic'
        CHECK (trust_level IN (
            'basic',
            'verified',
            'trusted',
            'moderator',
            'admin'
        ));

-- ============================================================
-- 2. approved_incidents_count
-- Running total of how many of this user's incident reports
-- have been approved by a moderator. When this reaches 3,
-- the user becomes eligible for promotion to 'trusted'.
-- Maintained by a trigger / application logic on approval.
-- ============================================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS approved_incidents_count INT
        NOT NULL
        DEFAULT 0
        CHECK (approved_incidents_count >= 0);

-- ============================================================
-- 3. incidents_always_anonymous
-- When TRUE, the platform NEVER attaches the user's real
-- identity to any incident they report, even if they do not
-- tick the anonymous checkbox at submission time.
-- Default: TRUE (privacy-first approach).
-- ============================================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS incidents_always_anonymous BOOLEAN
        NOT NULL
        DEFAULT TRUE;

-- ============================================================
-- 4. forums_default_anonymous
-- When TRUE, the user's forum/discussion posts default to
-- anonymous mode. Users can override per-post.
-- Default: FALSE (forum posts show username by default).
-- ============================================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS forums_default_anonymous BOOLEAN
        NOT NULL
        DEFAULT FALSE;

-- ============================================================
-- INDEXES
-- ============================================================

-- Used by moderation dashboard to find promotion candidates:
-- 'users with 3+ approved incidents who are not yet trusted'
CREATE INDEX IF NOT EXISTS idx_users_trust_level
    ON users (trust_level);

-- Composite index: find promotion candidates in one query
CREATE INDEX IF NOT EXISTS idx_users_trust_promotion_candidates
    ON users (trust_level, approved_incidents_count)
    WHERE trust_level = 'verified' AND approved_incidents_count >= 3;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON COLUMN users.trust_level IS
    '5-tier trust level: basic | verified | trusted | moderator | admin. Controls platform permissions.';

COMMENT ON COLUMN users.approved_incidents_count IS
    'Running count of moderator-approved incident reports by this user. Triggers promotion eligibility at 3.';

COMMENT ON COLUMN users.incidents_always_anonymous IS
    'When TRUE, user identity is never attached to incident reports regardless of per-submission setting. Default TRUE.';

COMMENT ON COLUMN users.forums_default_anonymous IS
    'When TRUE, forum posts default to anonymous. Users can override per post. Default FALSE.';

-- ============================================================
-- BACKFILL: Set all existing users to verified trust_level
-- if they have a verified email, otherwise keep basic.
-- This is safe to run multiple times (idempotent).
-- ============================================================
UPDATE users
    SET trust_level = 'verified'
WHERE
    is_email_verified = TRUE
    AND trust_level = 'basic';

-- ============================================================
-- VERIFY (run manually after migration to confirm):
--   SELECT column_name, data_type, column_default, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'users'
--     AND column_name IN (
--       'trust_level',
--       'approved_incidents_count',
--       'incidents_always_anonymous',
--       'forums_default_anonymous'
--     );
-- Expected: 4 rows returned.
-- ============================================================
