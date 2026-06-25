-- Migration 018: Fix registration_attempts.referral_code column length
--
-- Problem: referral_code was VARCHAR(50), but invite tokens are 64-char hex
-- strings. When an admin invite link is used to register, the invite token is
-- passed as referral_code for backward-compat, causing:
--   "value too long for type character varying(50)"
--
-- Fix: Widen the column to VARCHAR(255) to accommodate both short referral
-- codes and full 64-char invite tokens.

ALTER TABLE registration_attempts
  ALTER COLUMN referral_code TYPE VARCHAR(255);
