-- ============================================================
-- 021_add_forum_announcements.sql
-- Permanent admin-only announcement timeline entries
-- ============================================================

CREATE TABLE IF NOT EXISTS forum_announcements (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200)  NOT NULL,
  content     TEXT          NOT NULL,
  -- posted_at is admin-controlled so entries can be backdated if needed.
  -- Defaults to NOW() but can be overridden on INSERT/UPDATE.
  posted_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  author_id   INTEGER       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Fast ordering by posted_at DESC for timeline rendering
CREATE INDEX IF NOT EXISTS idx_forum_announcements_posted_at
  ON forum_announcements(posted_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_forum_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forum_announcements_updated_at ON forum_announcements;
CREATE TRIGGER trg_forum_announcements_updated_at
  BEFORE UPDATE ON forum_announcements
  FOR EACH ROW EXECUTE FUNCTION update_forum_announcements_updated_at();
