-- Migration 015: pending_incident_edits table
-- Stores proposed edits to incidents, pending moderator approval.
-- Old data stays intact on the live incident until approved.

CREATE TABLE IF NOT EXISTS pending_incident_edits (
  id                  SERIAL PRIMARY KEY,
  incident_id         INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  requested_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Snapshot of old incident data (core fields)
  old_company_gstn    VARCHAR(15),
  old_company_name    VARCHAR(255),
  old_state           VARCHAR(100),
  old_pincode         VARCHAR(10),
  old_street_address  TEXT,
  old_msme_udyam_number VARCHAR(30),
  old_incident_type   VARCHAR(50),
  old_incident_date   DATE,
  old_incident_title  VARCHAR(255),
  old_description     TEXT,
  old_amount_involved NUMERIC(15,2),
  old_currency_code   VARCHAR(3),

  -- Proposed new incident data (core fields)
  new_company_gstn    VARCHAR(15),
  new_company_name    VARCHAR(255),
  new_state           VARCHAR(100),
  new_pincode         VARCHAR(10),
  new_street_address  TEXT,
  new_msme_udyam_number VARCHAR(30),
  new_incident_type   VARCHAR(50),
  new_incident_date   DATE,
  new_incident_title  VARCHAR(255),
  new_description     TEXT,
  new_amount_involved NUMERIC(15,2),
  new_currency_code   VARCHAR(3),

  -- JSON snapshots for invoice rows and contact persons (arrays)
  old_invoices        JSONB DEFAULT '[]',
  new_invoices        JSONB DEFAULT '[]',
  old_contacts        JSONB DEFAULT '[]',
  new_contacts        JSONB DEFAULT '[]',

  -- Moderation outcome
  moderator_notes     TEXT,
  reviewed_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMP WITH TIME ZONE,
  rejection_reason    TEXT,

  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_edits_incident_id ON pending_incident_edits(incident_id);
CREATE INDEX IF NOT EXISTS idx_pending_edits_status ON pending_incident_edits(status);
CREATE INDEX IF NOT EXISTS idx_pending_edits_requested_by ON pending_incident_edits(requested_by);
