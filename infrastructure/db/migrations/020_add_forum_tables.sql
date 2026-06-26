-- ============================================================
-- 020_add_forum_tables.sql
-- Forum: posts, replies, votes + anon_handle on users
-- ============================================================

-- 1. Add anonymous forum handle to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS forum_anon_handle VARCHAR(40) UNIQUE;

COMMENT ON COLUMN users.forum_anon_handle IS
  'User-chosen pseudonym for anonymous forum posts/replies. Globally unique. NULL means the user has not set one yet.';

-- 2. Trust level ordering helper (used in visibility checks)
-- Hierarchy: new(0) basic(1) verified(2) trusted(3) moderator(4) admin(5)

-- 3. Forum posts
CREATE TABLE IF NOT EXISTS forum_posts (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(200)  NOT NULL,
  content         TEXT          NOT NULL,
  category        VARCHAR(60)   NOT NULL,
  -- Visibility: the minimum trust level that can see this post.
  -- Everyone at or above this level sees it.
  min_trust_level VARCHAR(20)   NOT NULL DEFAULT 'basic'
                    CHECK (min_trust_level IN ('basic','verified','trusted','moderator','admin')),
  author_id       INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_anonymous    BOOLEAN       NOT NULL DEFAULT FALSE,
  -- Denormalised counts for fast list rendering
  upvotes         INTEGER       NOT NULL DEFAULT 0,
  downvotes       INTEGER       NOT NULL DEFAULT 0,
  reply_count     INTEGER       NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_category        ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author          ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_min_trust_level ON forum_posts(min_trust_level);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at      ON forum_posts(created_at DESC);

-- 4. Forum replies
CREATE TABLE IF NOT EXISTS forum_replies (
  id           SERIAL PRIMARY KEY,
  post_id      INTEGER       NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  content      TEXT          NOT NULL,
  author_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN       NOT NULL DEFAULT FALSE,
  upvotes      INTEGER       NOT NULL DEFAULT 0,
  downvotes    INTEGER       NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id    ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author     ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at ASC);

-- 5. Forum votes (one vote per user per target — enforced by unique constraint)
CREATE TABLE IF NOT EXISTS forum_votes (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('post', 'reply')),
  target_id   INTEGER     NOT NULL,
  vote_type   VARCHAR(4)  NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_votes_target ON forum_votes(target_type, target_id);

-- 6. Trigger: auto-update updated_at on forum_posts
CREATE OR REPLACE FUNCTION update_forum_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forum_posts_updated_at ON forum_posts;
CREATE TRIGGER trg_forum_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_forum_posts_updated_at();

-- 7. Trigger: auto-update updated_at on forum_replies
CREATE OR REPLACE FUNCTION update_forum_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forum_replies_updated_at ON forum_replies;
CREATE TRIGGER trg_forum_replies_updated_at
  BEFORE UPDATE ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION update_forum_replies_updated_at();
