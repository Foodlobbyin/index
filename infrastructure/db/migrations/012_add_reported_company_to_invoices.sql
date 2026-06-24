-- Migration 012: Link invoices to reported companies (submitted via incident reports)
-- invoices.company_id links to company_profiles (the user's own registered company).
-- When an incident report is submitted, the invoice belongs to the REPORTED (external) company,
-- which may not be a registered company_profiles entry.
-- We add reported_company_gstn and reported_company_name so these invoices can be
-- queried by GSTN or name on the public company profile page.
-- incident_id links back to the originating incident report.

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS reported_company_gstn   VARCHAR(15),
  ADD COLUMN IF NOT EXISTS reported_company_name   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS incident_id             INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS item_sold               VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reporter_user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN invoices.reported_company_gstn IS 'GSTN of the externally-reported company (from incident submission)';
COMMENT ON COLUMN invoices.reported_company_name IS 'Name of the externally-reported company (from incident submission)';
COMMENT ON COLUMN invoices.incident_id           IS 'Originating incident report ID';
COMMENT ON COLUMN invoices.item_sold             IS 'Item or commodity sold in this transaction';
COMMENT ON COLUMN invoices.reporter_user_id      IS 'User who submitted the incident report for this invoice';

-- Also add position to contact_persons for the Step 3 form field
ALTER TABLE contact_persons
  ADD COLUMN IF NOT EXISTS position    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS incident_id INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_gstn VARCHAR(15);

COMMENT ON COLUMN contact_persons.position     IS 'Role/position of the contact person';
COMMENT ON COLUMN contact_persons.incident_id  IS 'Originating incident report ID';
COMMENT ON COLUMN contact_persons.company_gstn IS 'GSTN of the company this contact is associated with';

-- Index for fast lookups on company profile page
CREATE INDEX IF NOT EXISTS idx_invoices_reported_gstn ON invoices(reported_company_gstn);
CREATE INDEX IF NOT EXISTS idx_invoices_reported_name ON invoices(reported_company_name);
CREATE INDEX IF NOT EXISTS idx_contact_persons_company ON contact_persons(company);
CREATE INDEX IF NOT EXISTS idx_contact_persons_company_gstn ON contact_persons(company_gstn);
