-- Migration 023: User sessions table
-- Tracks active login sessions so users can view and revoke them.
-- token_hash is SHA-256(jwt_token) — never store raw JWTs.

CREATE TABLE IF NOT EXISTS user_sessions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(64) NOT NULL UNIQUE,   -- SHA-256 hex of the JWT
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_revoked    BOOLEAN   NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id    ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active
  ON user_sessions (user_id, is_revoked)
  WHERE is_revoked = FALSE;
