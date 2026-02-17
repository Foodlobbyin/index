-- Add GSTN field and account_activated flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS gstn VARCHAR(15);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_activated BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Create index on GSTN for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_gstn ON users(gstn);
CREATE INDEX IF NOT EXISTS idx_user_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_account_activated ON users(account_activated);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  max_uses INTEGER NOT NULL DEFAULT 10,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP,
  allowed_email_domain VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for referrals
CREATE INDEX IF NOT EXISTS idx_referral_code ON referrals(code);
CREATE INDEX IF NOT EXISTS idx_referral_created_by ON referrals(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_is_active ON referrals(is_active);

-- Create registration_attempts table for logging and anti-abuse
CREATE TABLE IF NOT EXISTS registration_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  ip_address VARCHAR(45),
  referral_code VARCHAR(50),
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for registration_attempts
CREATE INDEX IF NOT EXISTS idx_registration_attempts_email ON registration_attempts(email);
CREATE INDEX IF NOT EXISTS idx_registration_attempts_ip ON registration_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_registration_attempts_created_at ON registration_attempts(created_at);

-- Create OTP attempts tracking table
CREATE TABLE IF NOT EXISTS otp_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  attempt_type VARCHAR(20) NOT NULL, -- 'generation' or 'verification'
  success BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for OTP attempts
CREATE INDEX IF NOT EXISTS idx_otp_attempts_email ON otp_attempts(email);
CREATE INDEX IF NOT EXISTS idx_otp_attempts_ip ON otp_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_otp_attempts_created_at ON otp_attempts(created_at);

-- Add OTP attempt count fields to users for quick access
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_generation_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_verification_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_last_generated_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_last_verified_at TIMESTAMP;
