-- 005_incident_system_documentation.sql
-- Documentation of the Incident Management System schema
-- for the FoodLobby platform (foodlobbyin database)
-- Created: 2026-02-21

-- ============================================================
-- TABLE: incidents
-- Core incident reports submitted by users
-- ============================================================
CREATE TABLE IF NOT EXISTS incidents (
    id                  SERIAL PRIMARY KEY,

    -- Company being reported
    company_gstn        VARCHAR(15),
    company_name        VARCHAR(255) NOT NULL,

    -- Incident details
    incident_type       VARCHAR(50) NOT NULL
                            CHECK (incident_type IN (
                                'FRAUD', 'QUALITY_ISSUE', 'SERVICE_ISSUE',
                                'PAYMENT_ISSUE', 'CONTRACT_BREACH', 'OTHER'
                            )),
    incident_date       DATE NOT NULL,
    incident_title      VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,

    -- Financial impact
    amount_involved     NUMERIC(15, 2),
    currency_code       VARCHAR(3) NOT NULL DEFAULT 'INR',

    -- Reporter information
    reporter_id         INT REFERENCES users(id) ON DELETE SET NULL,
    is_anonymous        BOOLEAN NOT NULL DEFAULT FALSE,
    reporter_name       VARCHAR(255),
    reporter_email      VARCHAR(255),
    reporter_phone      VARCHAR(20),

    -- Status & moderation
    status              VARCHAR(20) NOT NULL DEFAULT 'draft'
                            CHECK (status IN (
                                'draft', 'submitted', 'under_review',
                                'approved', 'rejected', 'resolved'
                            )),
    moderator_notes     TEXT,
    reviewed_by         INT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at         TIMESTAMP WITH TIME ZONE,
    rejection_reason    TEXT,

    -- Metadata
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for incidents
CREATE INDEX IF NOT EXISTS idx_incidents_status        ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_company_gstn  ON incidents(company_gstn);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_id   ON incidents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_incidents_incident_type ON incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at    ON incidents(created_at DESC);

-- ============================================================
-- TABLE: incident_evidence
-- Supporting documents/files attached to an incident
-- ============================================================
CREATE TABLE IF NOT EXISTS incident_evidence (
    id              SERIAL PRIMARY KEY,
    incident_id     INT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    file_name       VARCHAR(255) NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    file_size       INT,
    mime_type       VARCHAR(100),
    uploaded_by     INT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_evidence_incident_id ON incident_evidence(incident_id);

-- ============================================================
-- TABLE: incident_penalties
-- Penalty information linked to approved incidents
-- ============================================================
CREATE TABLE IF NOT EXISTS incident_penalties (
    id              SERIAL PRIMARY KEY,
    incident_id     INT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    penalty_amount  NUMERIC(15, 2) NOT NULL CHECK (penalty_amount > 0),
    currency_code   VARCHAR(3) NOT NULL DEFAULT 'INR',
    penalty_reason  TEXT NOT NULL,
    imposed_by      INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    imposed_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_penalties_incident_id ON incident_penalties(incident_id);

-- ============================================================
-- TABLE: incident_responses
-- Company responses to incident reports
-- ============================================================
CREATE TABLE IF NOT EXISTS incident_responses (
    id              SERIAL PRIMARY KEY,
    incident_id     INT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    responder_gstn  VARCHAR(15) NOT NULL,
    responder_name  VARCHAR(255),
    response_text   TEXT NOT NULL,
    responded_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_responses_incident_id  ON incident_responses(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_responses_responder_gstn ON incident_responses(responder_gstn);

-- ============================================================
-- TABLE: incident_moderation_log
-- Audit trail for all moderation actions
-- ============================================================
CREATE TABLE IF NOT EXISTS incident_moderation_log (
    id              SERIAL PRIMARY KEY,
    incident_id     INT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    moderator_id    INT REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(50) NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_log_incident_id ON incident_moderation_log(incident_id);

-- ============================================================
-- TABLE: contact_persons
-- Contact information associated with incidents
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_persons (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(20),
    company     VARCHAR(255),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: user_searches
-- Search history for rate-limiting and analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS user_searches (
    id          SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id) ON DELETE SET NULL,
    query       TEXT,
    searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_searches_user_id    ON user_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_searches_searched_at ON user_searches(searched_at DESC);

-- ============================================================
-- ALTER: users table
-- Add columns required by the incident search rate-limiter
-- ============================================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS daily_search_count      INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_search_reset_date  DATE;

-- ============================================================
-- VIEWS
-- ============================================================

-- Active (approved/resolved) incidents visible to the public
CREATE OR REPLACE VIEW active_incidents AS
    SELECT * FROM incidents
    WHERE status IN ('approved', 'resolved');

-- Incidents awaiting moderator review
CREATE OR REPLACE VIEW moderation_queue AS
    SELECT * FROM incidents
    WHERE status IN ('submitted', 'under_review')
    ORDER BY created_at ASC;

-- ============================================================
-- SAMPLE DATA (3 test incidents already inserted)
-- ============================================================
-- INSERT INTO incidents (
--     company_gstn, company_name, incident_type, incident_date,
--     incident_title, description, status
-- ) VALUES
--     ('27AAPFU0939F1ZV', 'Test Company A', 'FRAUD', '2025-12-01',
--      'Fraudulent invoice', 'Company issued a fraudulent invoice.', 'approved'),
--     ('29AABCT1332L1ZU', 'Test Company B', 'QUALITY_ISSUE', '2025-12-15',
--      'Substandard goods delivered', 'Goods delivered did not meet specification.', 'submitted'),
--     ('07AAGCM9453L1Z4', 'Test Company C', 'PAYMENT_ISSUE', '2026-01-10',
--      'Payment not received', 'Payment for services rendered not received.', 'draft');
