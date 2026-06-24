-- Migration 014: Master Companies Table
--
-- Architecture:
--   companies           → ONE table for ALL companies (registered members + reported defaulters)
--   company_profiles    → extended profile for registered members; now has company_id FK → companies.id
--   incidents           → now has company_id FK → companies.id (authoritative link)
--
-- GSTN is the unique identifier. company_name is the canonical display name.
-- When a GSTN-less company is reported, it is stored with gstn=NULL.

-- ============================================================
-- TABLE: companies
-- One row per unique company, identified by GSTN (when available).
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
    id                  SERIAL PRIMARY KEY,
    gstn                VARCHAR(15) UNIQUE,             -- nullable for GSTN-less entries
    company_name        VARCHAR(255) NOT NULL,
    state               VARCHAR(100),
    pincode             VARCHAR(10),
    street_address      TEXT,
    msme_udyam_number   VARCHAR(50),
    industry            VARCHAR(100),
    is_registered_member BOOLEAN NOT NULL DEFAULT FALSE,
    member_user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_gstn            ON companies(gstn) WHERE gstn IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_member_user_id  ON companies(member_user_id) WHERE member_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_company_name    ON companies(company_name);

-- ============================================================
-- POPULATE: from registered members (users with GSTN)
-- Join users → company_profiles to get industry; use users.gstn
-- ============================================================
INSERT INTO companies (gstn, company_name, state, industry, is_registered_member, member_user_id)
SELECT
    NULLIF(TRIM(u.gstn), '')          AS gstn,
    COALESCE(
        NULLIF(TRIM(cp.company_name), ''),
        u.username
    )                                 AS company_name,
    NULL::varchar                     AS state,
    cp.industry                       AS industry,
    TRUE                              AS is_registered_member,
    u.id                              AS member_user_id
FROM users u
LEFT JOIN company_profiles cp ON cp.user_id = u.id
WHERE u.gstn IS NOT NULL
  AND TRIM(u.gstn) <> ''
ON CONFLICT (gstn) DO NOTHING;

-- ============================================================
-- POPULATE: from incidents (reported defaulters, GSTN present)
-- Only insert if not already added by the registered-member pass above.
-- ============================================================
INSERT INTO companies (gstn, company_name, is_registered_member)
SELECT DISTINCT
    TRIM(i.company_gstn)              AS gstn,
    MAX(i.company_name)               AS company_name,
    FALSE                             AS is_registered_member
FROM incidents i
WHERE i.company_gstn IS NOT NULL
  AND TRIM(i.company_gstn) <> ''
GROUP BY TRIM(i.company_gstn)
ON CONFLICT (gstn) DO NOTHING;

-- ============================================================
-- POPULATE: from incidents without GSTN (name-only companies)
-- Use distinct company_name. No dedup key — accept potential dupes.
-- ============================================================
INSERT INTO companies (gstn, company_name, is_registered_member)
SELECT DISTINCT
    NULL::varchar                     AS gstn,
    TRIM(i.company_name)              AS company_name,
    FALSE                             AS is_registered_member
FROM incidents i
WHERE (i.company_gstn IS NULL OR TRIM(i.company_gstn) = '')
  AND TRIM(i.company_name) <> '';

-- ============================================================
-- ALTER: company_profiles — add company_id FK
-- ============================================================
ALTER TABLE company_profiles
    ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL;

-- Backfill company_profiles.company_id from companies via member_user_id
UPDATE company_profiles cp
SET company_id = c.id
FROM companies c
WHERE c.member_user_id = cp.user_id
  AND cp.company_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_company_profiles_company_id ON company_profiles(company_id);

-- ============================================================
-- ALTER: incidents — add company_id FK
-- ============================================================
ALTER TABLE incidents
    ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL;

-- Backfill incidents.company_id — match by GSTN first, then by name
UPDATE incidents i
SET company_id = c.id
FROM companies c
WHERE c.gstn IS NOT NULL
  AND TRIM(i.company_gstn) = c.gstn
  AND i.company_id IS NULL;

-- For incidents without GSTN or unmatched, match by exact company_name
UPDATE incidents i
SET company_id = (
    SELECT c.id
    FROM companies c
    WHERE c.gstn IS NULL
      AND LOWER(TRIM(c.company_name)) = LOWER(TRIM(i.company_name))
    ORDER BY c.id
    LIMIT 1
)
WHERE i.company_id IS NULL
  AND (i.company_gstn IS NULL OR TRIM(i.company_gstn) = '');

CREATE INDEX IF NOT EXISTS idx_incidents_company_id ON incidents(company_id);

-- ============================================================
-- UPDATE VIEW: contact_person_companies — refresh to include company_id
-- ============================================================
CREATE OR REPLACE VIEW contact_person_companies AS
SELECT
    cp.id                                             AS contact_person_id,
    cp.name                                           AS contact_name,
    i.company_name,
    i.company_gstn,
    i.company_id,
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
GROUP BY cp.id, cp.name, i.company_name, i.company_gstn, i.company_id;
