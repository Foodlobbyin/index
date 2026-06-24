-- Migration 011: Invite token system, waitlist, and user status
-- Replaces referral code system with link-based invite tokens

-- 1. Add registration_status to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20)
    NOT NULL DEFAULT 'active'
    CHECK (registration_status IN ('active', 'pending_review', 'waitlist', 'declined'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS invite_token_id INTEGER;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS can_send_invites BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS daily_search_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_search_reset_date DATE;

CREATE INDEX IF NOT EXISTS idx_users_registration_status ON users(registration_status);

-- 2. Create invite_tokens table
CREATE TABLE IF NOT EXISTS invite_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('marketing', 'member')),
  invited_email VARCHAR(255) NOT NULL,
  invited_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'revoked')),
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  used_at TIMESTAMP,
  used_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_email ON invite_tokens(invited_email);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_status ON invite_tokens(status);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_invited_by ON invite_tokens(invited_by_user_id);

-- 3. Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(20),
  gstn VARCHAR(15),
  business_description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'invited', 'registered', 'declined')),
  invite_token_id INTEGER REFERENCES invite_tokens(id) ON DELETE SET NULL,
  invited_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
