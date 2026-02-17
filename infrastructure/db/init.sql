-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_company_user_id ON company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_company_industry ON company_profiles(industry);

-- Sample seed data (optional, for testing)
-- Uncomment the lines below to add sample data

-- INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES
-- ('demo_user', 'demo@example.com', '$2b$10$X/YVvDqGRLxRZBGZJXvCGuDvPuVvqx8QGX8kPnJ8YlQhLZDfBPKOy', 'Demo', 'User');
-- Note: The password hash above is for 'password123'

