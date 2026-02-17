-- Add new fields to users table for email verification, password reset, and OTP
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp_expires TIMESTAMP;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Create index on mobile_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_mobile_number ON users(mobile_number);

-- Create index on email_verification_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON users(email_verification_token);

-- Create index on password_reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON users(password_reset_token);
