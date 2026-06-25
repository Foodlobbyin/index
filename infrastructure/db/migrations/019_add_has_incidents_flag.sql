-- Migration 019: Add has_incidents flag to companies table
--
-- Purpose:
--   Drive the "My Defaults" nav-item visibility from a single boolean
--   instead of a live COUNT query on every page load.
--
-- Lifecycle:
--   1. Set to TRUE in incident.repository.ts when a new incident is
--      created/inserted against a GSTN (see create() method).
--   2. Read via users JOIN companies in user.repository.ts findById()
--      so the flag travels with the user session — zero extra queries.
--
-- NOTE: Flag is never set back to FALSE automatically.
--   If all incidents against a company are deleted by admin, the flag
--   would need a manual reset — acceptable edge-case for now.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS has_incidents BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: mark every company that already has at least one incident
-- in a non-draft status (submitted, under_review, approved, resolved).
UPDATE companies c
SET has_incidents = TRUE
WHERE EXISTS (
  SELECT 1
  FROM incidents i
  WHERE i.company_gstn IS NOT NULL
    AND UPPER(TRIM(i.company_gstn)) = c.gstn
    AND i.status IN ('submitted', 'under_review', 'approved', 'resolved')
);

-- Also cover incidents linked via company_id (for GSTN-less entries)
UPDATE companies c
SET has_incidents = TRUE
WHERE c.has_incidents = FALSE
  AND EXISTS (
    SELECT 1
    FROM incidents i
    WHERE i.company_id = c.id
      AND i.status IN ('submitted', 'under_review', 'approved', 'resolved')
  );

-- Auto-link member_user_id for registered users whose GSTN already has a
-- companies row but the link was never made (covers users like Jonty Roots).
UPDATE companies c
SET
  member_user_id      = u.id,
  is_registered_member = TRUE,
  updated_at          = NOW()
FROM users u
WHERE u.gstn IS NOT NULL
  AND UPPER(TRIM(u.gstn)) = c.gstn
  AND c.member_user_id IS NULL;
