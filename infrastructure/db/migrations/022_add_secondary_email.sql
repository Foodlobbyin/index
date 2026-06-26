-- Migration 022: Add secondary email support to users table
-- Allows users to register a secondary email (verified via OTP) as a future
-- pathway to change their primary email address.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS secondary_email          VARCHAR(255),
  ADD COLUMN IF NOT EXISTS secondary_email_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS secondary_email_otp       VARCHAR(10),
  ADD COLUMN IF NOT EXISTS secondary_email_otp_expires TIMESTAMP;

-- Unique constraint: no two users can claim the same secondary email
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_secondary_email
  ON users (secondary_email)
  WHERE secondary_email IS NOT NULL;
