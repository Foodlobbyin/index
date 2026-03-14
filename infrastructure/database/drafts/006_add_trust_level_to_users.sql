-- Migration 006: Add trust level system to users table
-- Based on DATABASE_ARCHITECTURE_FINAL.md design

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trust_level VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (trust_level IN ('new', 'verified', 'trusted', 'moderator', 'admin'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS approved_incidents_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS incidents_always_anonymous BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS forums_default_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_trust_level ON users(trust_level);

-- Note: Set initial admin/moderator accounts manually after running this migration:
-- UPDATE users SET trust_level = 'admin' WHERE username = 'your_admin_username';
-- UPDATE users SET trust_level = 'moderator' WHERE username = 'your_moderator_username';
-- UPDATE users SET trust_level = 'verified' WHERE email_verified = TRUE;
