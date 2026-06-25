-- Migration 016: add invoice_number to incident_invoices
ALTER TABLE incident_invoices ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
