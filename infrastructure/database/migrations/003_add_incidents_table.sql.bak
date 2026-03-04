-- Migration for Incidents System
-- Date: 2026-02-18

-- Create incidents table
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create incident_evidence table
CREATE TABLE incident_evidence (
    id SERIAL PRIMARY KEY,
    incident_id INT REFERENCES incidents(id) ON DELETE CASCADE,
    evidence_type VARCHAR(100),
    evidence_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create incident_responses table
CREATE TABLE incident_responses (
    id SERIAL PRIMARY KEY,
    incident_id INT REFERENCES incidents(id) ON DELETE CASCADE,
    response_text TEXT,
    response_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create incident_moderation_log table
CREATE TABLE incident_moderation_log (
    id SERIAL PRIMARY KEY,
    incident_id INT REFERENCES incidents(id) ON DELETE CASCADE,
    moderator_action VARCHAR(255),
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contact_persons table
CREATE TABLE contact_persons (
    id SERIAL PRIMARY KEY,
    incident_id INT REFERENCES incidents(id) ON DELETE CASCADE,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50)
);

-- Indexes
CREATE INDEX idx_incident_status ON incidents(status);
CREATE INDEX idx_evidence_incident ON incident_evidence(incident_id);
CREATE INDEX idx_response_incident ON incident_responses(incident_id);
CREATE INDEX idx_moderation_incident ON incident_moderation_log(incident_id);
CREATE INDEX idx_contact_incident ON contact_persons(incident_id);

-- Sample seed data
INSERT INTO incidents (title, description, status) VALUES ('Sample Incident', 'This is a sample incident description.', 'Open');
INSERT INTO incident_evidence (incident_id, evidence_type, evidence_data) VALUES (1, 'Image', 'sample_evidence_1.jpg');
INSERT INTO incident_responses (incident_id, response_text) VALUES (1, 'Response to the incident.');
INSERT INTO incident_moderation_log (incident_id, moderator_action) VALUES (1, 'Moderated the incident.');
INSERT INTO contact_persons (incident_id, name, email, phone) VALUES (1, 'John Doe', 'johndoe@example.com', '1234567890');