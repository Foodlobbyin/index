-- ============================================================
-- Migration: 007_add_exchange_rates.sql
-- Description: Add exchange_rates table for multi-currency
--              support in incident financial tracking.
-- Depends on:  003_add_incidents_schema.sql
-- Author:      Foodlobbyin
-- Date:        2026-03-28
-- ============================================================

-- ============================================================
-- TABLE: exchange_rates
-- Stores daily currency conversion rates used to normalise
-- incident financial amounts to INR for display and analytics.
-- Unique constraint prevents duplicate rates for the same
-- currency pair on the same effective date.
-- ============================================================
CREATE TABLE IF NOT EXISTS exchange_rates (
    id                  SERIAL PRIMARY KEY,

    -- Currency pair
    from_currency       VARCHAR(3)      NOT NULL,   -- ISO 4217 code, e.g. 'USD'
    to_currency         VARCHAR(3)      NOT NULL,   -- ISO 4217 code, e.g. 'INR'

    -- Conversion
    rate                NUMERIC(18, 6)  NOT NULL
                            CHECK (rate > 0),       -- must be a positive number

    -- The date this rate is valid for (one rate per pair per day)
    effective_date      DATE            NOT NULL,

    -- Optional: source of the rate (manual entry, RBI API, etc.)
    source              VARCHAR(100),

    -- Metadata
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UNIQUE CONSTRAINT
-- Ensures only one exchange rate record exists per
-- (from_currency, to_currency, effective_date) combination.
-- Prevents duplicate/conflicting rates for the same day.
-- ============================================================
ALTER TABLE exchange_rates
    ADD CONSTRAINT uq_exchange_rates_pair_date
    UNIQUE (from_currency, to_currency, effective_date);

-- ============================================================
-- INDEXES
-- ============================================================

-- Fast lookup by currency pair (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair
    ON exchange_rates (from_currency, to_currency);

-- Fast lookup by effective date (for historical queries)
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date
    ON exchange_rates (effective_date DESC);

-- Composite index: pair + date (covers the most frequent query:
-- "give me the rate for USD/INR on date X")
CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair_date
    ON exchange_rates (from_currency, to_currency, effective_date DESC);

-- ============================================================
-- SEED: Baseline INR rates (approximate, 2026-03-28)
-- These are starting values only. Actual rates must be
-- updated daily via the rate-update job or RBI API.
-- ============================================================
INSERT INTO exchange_rates
    (from_currency, to_currency, rate, effective_date, source)
VALUES
    ('USD', 'INR', 83.500000, '2026-03-28', 'seed_baseline'),
    ('EUR', 'INR', 90.200000, '2026-03-28', 'seed_baseline'),
    ('GBP', 'INR', 105.800000, '2026-03-28', 'seed_baseline'),
    ('AED', 'INR', 22.730000, '2026-03-28', 'seed_baseline'),
    ('SGD', 'INR', 62.100000, '2026-03-28', 'seed_baseline'),
    ('INR', 'INR', 1.000000,  '2026-03-28', 'seed_baseline')   -- identity rate
ON CONFLICT ON CONSTRAINT uq_exchange_rates_pair_date DO NOTHING;

-- ============================================================
-- HELPER VIEW: latest_exchange_rates
-- Returns the most recent rate for every currency pair.
-- Used by the backend service to convert amounts to INR
-- without needing to pass a specific date.
-- ============================================================
CREATE OR REPLACE VIEW latest_exchange_rates AS
    SELECT DISTINCT ON (from_currency, to_currency)
        id,
        from_currency,
        to_currency,
        rate,
        effective_date,
        source
    FROM exchange_rates
    ORDER BY from_currency, to_currency, effective_date DESC;

-- ============================================================
-- COMMENT
-- ============================================================
COMMENT ON TABLE exchange_rates IS
    'Daily currency conversion rates. One record per (from_currency, to_currency, effective_date). Used to normalise incident financial amounts to INR.';

COMMENT ON COLUMN exchange_rates.from_currency IS 'Source currency ISO 4217 code (e.g. USD, EUR, GBP)';
COMMENT ON COLUMN exchange_rates.to_currency   IS 'Target currency ISO 4217 code — always INR for Foodlobbyin MVP';
COMMENT ON COLUMN exchange_rates.rate          IS 'Multiplier: 1 unit of from_currency = rate units of to_currency';
COMMENT ON COLUMN exchange_rates.effective_date IS 'The calendar date (IST) for which this rate is valid';
COMMENT ON COLUMN exchange_rates.source        IS 'Data source: seed_baseline | rbi_api | manual | open_exchange_rates';
