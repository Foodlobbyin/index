-- Base schema: users, company_profiles, invoices, and their indexes.
-- This file is executed first (alphabetically) by docker-entrypoint-initdb.d.
-- Subsequent numbered migration files add further tables and columns.

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(20) UNIQUE,
  phone_number VARCHAR(20),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  gstn VARCHAR(15),
  email_verified BOOLEAN DEFAULT FALSE,
  account_activated BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  email_otp VARCHAR(10),
  email_otp_expires TIMESTAMP,
  otp_generation_count INTEGER DEFAULT 0,
  otp_verification_count INTEGER DEFAULT 0,
  otp_last_generated_at TIMESTAMP,
  otp_last_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create company_profiles table
CREATE TABLE IF NOT EXISTS company_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  revenue DECIMAL(15, 2),
  employees INTEGER,
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  website VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES company_profiles(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_mobile_number ON users(mobile_number);
CREATE INDEX IF NOT EXISTS idx_user_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_gstn ON users(gstn);
CREATE INDEX IF NOT EXISTS idx_user_account_activated ON users(account_activated);
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_company_user_id ON company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_company_industry ON company_profiles(industry);
