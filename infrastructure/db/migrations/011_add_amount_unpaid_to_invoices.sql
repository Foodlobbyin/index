-- Add amount_unpaid column to invoices table
-- Tracks the outstanding unpaid balance separately from the total invoice amount

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS amount_unpaid DECIMAL(15, 2);

COMMENT ON COLUMN invoices.amount_unpaid IS 'Outstanding unpaid balance. NULL means full amount is unpaid.';
