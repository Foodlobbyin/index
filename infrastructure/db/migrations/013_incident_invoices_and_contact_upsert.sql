-- Migration 013: Proper incident_invoices table + contact_persons upsert support
-- 
-- Architecture:
--   incidents           → one per report (company + type + description)
--   incident_invoices   → child of incidents, one row per invoice (1 incident : many invoices)
--   contact_persons     → linked to incidents via incident_id; deduplicated by phone OR email
--
-- This replaces the temporary columns added in migration 012.

-- ============================================================
-- TABLE: incident_invoices
-- One row per invoice within an incident report.
-- An incident can have multiple invoices (e.g. 3 unpaid invoices from same company).
-- ============================================================
CREATE TABLE IF NOT EXISTS incident_invoices (
    id              SERIAL PRIMARY KEY,
    incident_id     INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

    -- Invoice financial details
    invoice_amount  NUMERIC(15, 2),            -- Total face value of the invoice
    unpaid_amount   NUMERIC(15, 2),            -- Outstanding unpaid portion
    invoice_date    DATE,                      -- Date the invoice was raised
    due_date        DATE,                      -- Payment due date (for overdue calculation)
    item_sold       VARCHAR(255),              -- Item / commodity sold
    currency_code   VARCHAR(3) NOT NULL DEFAULT 'INR',

    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_invoices_incident_id ON incident_invoices(incident_id);

-- ============================================================
-- EXTEND: contact_persons
-- Add incident_id linkage + upsert-support columns.
-- Deduplication: same phone OR same email = same person → UPSERT.
-- ============================================================
ALTER TABLE contact_persons
    ADD COLUMN IF NOT EXISTS incident_id    INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS company_gstn   VARCHAR(15),
    ADD COLUMN IF NOT EXISTS position       VARCHAR(100),
    -- canonical_phone / canonical_email store the normalised value used for dedup
    ADD COLUMN IF NOT EXISTS canonical_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS canonical_email VARCHAR(255);

-- Unique constraints used for the UPSERT (ON CONFLICT) logic
-- Each unique person is identified by their canonical phone OR email.
-- We use partial unique indexes so NULL values don't conflict.
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_persons_canonical_phone
    ON contact_persons(canonical_phone)
    WHERE canonical_phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_persons_canonical_email
    ON contact_persons(canonical_email)
    WHERE canonical_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_persons_incident_id  ON contact_persons(incident_id);
CREATE INDEX IF NOT EXISTS idx_contact_persons_company_gstn ON contact_persons(company_gstn);

-- ============================================================
-- VIEW: contact_person_companies
-- For the Contact Person profile page: companies + stats per person.
-- ============================================================
CREATE OR REPLACE VIEW contact_person_companies AS
SELECT
    cp.id                                             AS contact_person_id,
    cp.name                                           AS contact_name,
    i.company_name,
    i.company_gstn,
    COUNT(DISTINCT i.id)::int                         AS incident_count,
    COALESCE(SUM(ii.invoice_amount), 0)               AS total_invoice_amount,
    COALESCE(SUM(
        CASE WHEN ii.due_date < CURRENT_DATE THEN
            COALESCE(ii.unpaid_amount, ii.invoice_amount)
        ELSE 0 END
    ), 0)                                             AS total_unpaid
FROM contact_persons cp
JOIN incidents i ON i.id = cp.incident_id
LEFT JOIN incident_invoices ii ON ii.incident_id = i.id
GROUP BY cp.id, cp.name, i.company_name, i.company_gstn;

-- ============================================================
-- CLEAN UP columns added in migration 012 (now superseded)
-- Safe to remove since no production data exists in them yet.
-- ============================================================
ALTER TABLE invoices
    DROP COLUMN IF EXISTS reported_company_gstn,
    DROP COLUMN IF EXISTS reported_company_name,
    DROP COLUMN IF EXISTS incident_id,
    DROP COLUMN IF EXISTS item_sold,
    DROP COLUMN IF EXISTS reporter_user_id;
