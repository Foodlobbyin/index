-- Sample seed data for testing
-- Password for all demo users is 'password123'

-- Insert demo users
INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES
('alice_corp', 'alice@techcorp.com', '$2b$10$X/YVvDqGRLxRZBGZJXvCGuDvPuVvqx8QGX8kPnJ8YlQhLZDfBPKOy', 'Alice', 'Johnson'),
('bob_industries', 'bob@industries.com', '$2b$10$X/YVvDqGRLxRZBGZJXvCGuDvPuVvqx8QGX8kPnJ8YlQhLZDfBPKOy', 'Bob', 'Smith'),
('carol_solutions', 'carol@solutions.com', '$2b$10$X/YVvDqGRLxRZBGZJXvCGuDvPuVvqx8QGX8kPnJ8YlQhLZDfBPKOy', 'Carol', 'Williams')
ON CONFLICT (username) DO NOTHING;

-- Insert demo companies
INSERT INTO company_profiles (user_id, company_name, industry, revenue, employees, address, city, country, website) VALUES
((SELECT id FROM users WHERE username = 'alice_corp'), 'Tech Corp Inc', 'Technology', 5000000.00, 50, '123 Tech Street', 'San Francisco', 'USA', 'https://techcorp.example.com'),
((SELECT id FROM users WHERE username = 'bob_industries'), 'Bob Industries LLC', 'Manufacturing', 10000000.00, 200, '456 Industrial Ave', 'Detroit', 'USA', 'https://bobindustries.example.com'),
((SELECT id FROM users WHERE username = 'carol_solutions'), 'Carol Solutions', 'Consulting', 2000000.00, 25, '789 Business Blvd', 'New York', 'USA', 'https://carolsolutions.example.com');

-- Insert demo invoices
INSERT INTO invoices (company_id, invoice_number, amount, issue_date, due_date, status, description, category) VALUES
((SELECT id FROM company_profiles WHERE company_name = 'Tech Corp Inc'), 'INV-2024-001', 15000.00, '2024-01-15', '2024-02-15', 'paid', 'Software development services', 'Services'),
((SELECT id FROM company_profiles WHERE company_name = 'Tech Corp Inc'), 'INV-2024-002', 8500.00, '2024-02-01', '2024-03-01', 'paid', 'Cloud infrastructure', 'Infrastructure'),
((SELECT id FROM company_profiles WHERE company_name = 'Tech Corp Inc'), 'INV-2024-003', 12000.00, '2024-03-01', '2024-04-01', 'pending', 'Consulting services', 'Services'),
((SELECT id FROM company_profiles WHERE company_name = 'Bob Industries LLC'), 'INV-2024-101', 45000.00, '2024-01-10', '2024-02-10', 'paid', 'Raw materials', 'Materials'),
((SELECT id FROM company_profiles WHERE company_name = 'Bob Industries LLC'), 'INV-2024-102', 32000.00, '2024-02-15', '2024-03-15', 'paid', 'Equipment maintenance', 'Maintenance'),
((SELECT id FROM company_profiles WHERE company_name = 'Bob Industries LLC'), 'INV-2024-103', 28000.00, '2024-03-10', '2024-04-10', 'overdue', 'Logistics services', 'Services'),
((SELECT id FROM company_profiles WHERE company_name = 'Carol Solutions'), 'INV-2024-201', 18000.00, '2024-01-20', '2024-02-20', 'paid', 'Business consulting', 'Services'),
((SELECT id FROM company_profiles WHERE company_name = 'Carol Solutions'), 'INV-2024-202', 22000.00, '2024-02-25', '2024-03-25', 'pending', 'Strategic planning', 'Services');

SELECT 'Seed data inserted successfully' AS status;
