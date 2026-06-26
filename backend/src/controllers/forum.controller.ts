import type { Context } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';

// Trust level numeric rank — keep in sync with auth.middleware.ts
const TRUST_RANK: Record<string, number> = {
  new: 0,
  basic: 1,
  verified: 2,
  trusted: 3,
  moderator: 4,
  admin: 5,
};

/**
 * Trust levels a given poster can assign as min_trust_level for their post.
 * Rule: poster can only let users at OR BELOW their own level see the post
 * (they cannot grant access to levels above themselves).
 * Moderators/admins can set any level.
 */
function allowedMinTrustOptions(posterLevel: string): string[] {
  const rank = TRUST_RANK[posterLevel] ?? 1;
  const allLevels = ['basic', 'verified', 'trusted', 'moderator', 'admin'];
  // Return levels whose rank is <= poster's rank
  return allLevels.filter(l => TRUST_RANK[l] <= rank);
}

function displayName(row: { username: string; forum_anon_handle: string | null }, isAnon: boolean): string {
  if (isAnon) {
    return row.forum_anon_handle ?? 'Anonymous';
  }
  return row.username;
}

export class ForumController {
  // ─── GET /api/forum/posts ────────────────────────────────
  async getPosts(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const userRank = TRUST_RANK[user.trust_level ?? 'basic'] ?? 1;
      const category = c.req.query('category');

      // Caller sees posts whose min_trust_level rank <= their own rank
      let sql = `
        SELECT
          fp.id, fp.title, fp.content, fp.category,
          fp.min_trust_level, fp.is_anonymous,
          fp.upvotes, fp.downvotes, fp.reply_count,
          fp.created_at, fp.updated_at,
          u.username, u.forum_anon_handle,
          -- caller's own vote on each post
          fv.vote_type AS my_vote
        FROM forum_posts fp
        JOIN users u ON u.id = fp.author_id
        LEFT JOIN forum_votes fv
          ON fv.target_type = 'post'
          AND fv.target_id  = fp.id
          AND fv.user_id    = $1
        WHERE (
          CASE fp.min_trust_level
            WHEN 'basic'     THEN 1
            WHEN 'verified'  THEN 2
            WHEN 'trusted'   THEN 3
            WHEN 'moderator' THEN 4
            WHEN 'admin'     THEN 5
            ELSE 1
          END
        ) <= $2
      `;
      const params: (string | number)[] = [user.id, userRank];

      if (category) {
        params.push(category);
        sql += ` AND fp.category = $${params.length}`;
      }

      sql += ' ORDER BY fp.created_at DESC LIMIT 100';

      const result = await db.query(sql, params);

      const posts = result.rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        category: r.category,
        min_trust_level: r.min_trust_level,
        is_anonymous: r.is_anonymous,
        author: displayName(r, r.is_anonymous),
        upvotes: r.upvotes,
        downvotes: r.downvotes,
        reply_count: r.reply_count,
        created_at: r.created_at,
        updated_at: r.updated_at,
        my_vote: r.my_vote ?? null,
        // Expose author_id only to the post owner, mods, and admins
        is_own: r.author_id === user.id,
      }));

      // Also return what trust level options THIS user can set when posting
      const trustOptions = allowedMinTrustOptions(user.trust_level ?? 'basic');

      return c.json({ posts, trust_options: trustOptions }, 200);
    } catch (err: any) {
      console.error('forum getPosts error', err);
      return c.json({ error: 'Failed to load posts' }, 500);
    }
  }

  // ─── POST /api/forum/posts ───────────────────────────────
  async createPost(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = await c.req.json();
      const { title, content, category, min_trust_level, is_anonymous } = body;

      if (!title?.trim()) return c.json({ error: 'Title is required' }, 400);
      if (!content?.trim()) return c.json({ error: 'Content is required' }, 400);
      if (!category?.trim()) return c.json({ error: 'Category is required' }, 400);

      const validCategories = [
        'Logistics', 'Exports or Imports', 'Regulatory',
        'Taxes & GST', 'General Discussion', 'Payments', 'Banking & Finance',
      ];
      if (!validCategories.includes(category)) {
        return c.json({ error: 'Invalid category' }, 400);
      }

      // Validate min_trust_level is within what this user can set
      const allowed = allowedMinTrustOptions(user.trust_level ?? 'basic');
      const effectiveMinTrust = min_trust_level ?? 'basic';
      if (!allowed.includes(effectiveMinTrust)) {
        return c.json({ error: 'You cannot set that visibility level' }, 403);
      }

      // If posting anonymously, user must have set an anon handle
      if (is_anonymous) {
        const check = await db.query(
          'SELECT forum_anon_handle FROM users WHERE id = $1',
          [user.id]
        );
        if (!check.rows[0]?.forum_anon_handle) {
          return c.json({
            error: 'Set your anonymous handle in Profile Settings before posting anonymously',
          }, 400);
        }
      }

      const result = await db.query(
        `INSERT INTO forum_posts
           (title, content, category, min_trust_level, author_id, is_anonymous)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, content, category, min_trust_level, is_anonymous,
                   upvotes, downvotes, reply_count, created_at, updated_at`,
        [
          title.trim(),
          content.trim(),
          category,
          effectiveMinTrust,
          user.id,
          is_anonymous ?? false,
        ]
      );

      const post = result.rows[0];
      // Fetch display name
      const uRow = await db.query(
        'SELECT username, forum_anon_handle FROM users WHERE id = $1',
        [user.id]
      );
      post.author = displayName(uRow.rows[0], post.is_anonymous);
      post.my_vote = null;
      post.is_own = true;

      return c.json(post, 201);
    } catch (err: any) {
      console.error('forum createPost error', err);
      return c.json({ error: 'Failed to create post' }, 500);
    }
  }

  // ─── GET /api/forum/posts/:id ────────────────────────────
  async getPost(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const postId = parseInt(c.req.param('id')!);
      if (isNaN(postId)) return c.json({ error: 'Invalid post id' }, 400);

      const userRank = TRUST_RANK[user.trust_level ?? 'basic'] ?? 1;

      const postResult = await db.query(
        `SELECT fp.*, u.username, u.forum_anon_handle,
                fv.vote_type AS my_vote
         FROM forum_posts fp
         JOIN users u ON u.id = fp.author_id
         LEFT JOIN forum_votes fv
           ON fv.target_type = 'post' AND fv.target_id = fp.id AND fv.user_id = $1
         WHERE fp.id = $2`,
        [user.id, postId]
      );

      if (!postResult.rows.length) return c.json({ error: 'Post not found' }, 404);

      const post = postResult.rows[0];
      const minRank = TRUST_RANK[post.min_trust_level] ?? 1;
      if (userRank < minRank) return c.json({ error: 'Access denied' }, 403);

      // Replies
      const repliesResult = await db.query(
        `SELECT fr.*, u.username, u.forum_anon_handle,
                fv.vote_type AS my_vote
         FROM forum_replies fr
         JOIN users u ON u.id = fr.author_id
         LEFT JOIN forum_votes fv
           ON fv.target_type = 'reply' AND fv.target_id = fr.id AND fv.user_id = $1
         WHERE fr.post_id = $2
         ORDER BY fr.created_at ASC`,
        [user.id, postId]
      );

      const replies = repliesResult.rows.map((r: any) => ({
        id: r.id,
        post_id: r.post_id,
        content: r.content,
        is_anonymous: r.is_anonymous,
        author: displayName(r, r.is_anonymous),
        upvotes: r.upvotes,
        downvotes: r.downvotes,
        created_at: r.created_at,
        my_vote: r.my_vote ?? null,
        is_own: r.author_id === user.id,
      }));

      return c.json({
        post: {
          id: post.id,
          title: post.title,
          content: post.content,
          category: post.category,
          min_trust_level: post.min_trust_level,
          is_anonymous: post.is_anonymous,
          author: displayName(post, post.is_anonymous),
          upvotes: post.upvotes,
          downvotes: post.downvotes,
          reply_count: post.reply_count,
          created_at: post.created_at,
          updated_at: post.updated_at,
          my_vote: post.my_vote ?? null,
          is_own: post.author_id === user.id,
        },
        replies,
      }, 200);
    } catch (err: any) {
      console.error('forum getPost error', err);
      return c.json({ error: 'Failed to load post' }, 500);
    }
  }

  // ─── DELETE /api/forum/posts/:id ─────────────────────────
  async deletePost(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const postId = parseInt(c.req.param('id')!);
      if (isNaN(postId)) return c.json({ error: 'Invalid post id' }, 400);

      const result = await db.query(
        'SELECT author_id FROM forum_posts WHERE id = $1',
        [postId]
      );
      if (!result.rows.length) return c.json({ error: 'Post not found' }, 404);

      const isMod = TRUST_RANK[user.trust_level ?? 'basic'] >= TRUST_RANK['moderator'];
      if (result.rows[0].author_id !== user.id && !isMod) {
        return c.json({ error: 'Not authorized to delete this post' }, 403);
      }

      await db.query('DELETE FROM forum_posts WHERE id = $1', [postId]);
      return c.json({ message: 'Post deleted' }, 200);
    } catch (err: any) {
      console.error('forum deletePost error', err);
      return c.json({ error: 'Failed to delete post' }, 500);
    }
  }

  // ─── POST /api/forum/posts/:id/replies ───────────────────
  async createReply(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const postId = parseInt(c.req.param('id')!);
      if (isNaN(postId)) return c.json({ error: 'Invalid post id' }, 400);

      const body = await c.req.json();
      const { content, is_anonymous } = body;

      if (!content?.trim()) return c.json({ error: 'Content is required' }, 400);

      // Verify post exists and user can see it
      const userRank = TRUST_RANK[user.trust_level ?? 'basic'] ?? 1;
      const postCheck = await db.query(
        'SELECT min_trust_level FROM forum_posts WHERE id = $1',
        [postId]
      );
      if (!postCheck.rows.length) return c.json({ error: 'Post not found' }, 404);
      const minRank = TRUST_RANK[postCheck.rows[0].min_trust_level] ?? 1;
      if (userRank < minRank) return c.json({ error: 'Access denied' }, 403);

      // Anon check
      if (is_anonymous) {
        const check = await db.query(
          'SELECT forum_anon_handle FROM users WHERE id = $1',
          [user.id]
        );
        if (!check.rows[0]?.forum_anon_handle) {
          return c.json({
            error: 'Set your anonymous handle in Profile Settings before replying anonymously',
          }, 400);
        }
      }

      const result = await db.query(
        `INSERT INTO forum_replies (post_id, content, author_id, is_anonymous)
         VALUES ($1, $2, $3, $4)
         RETURNING id, post_id, content, is_anonymous, upvotes, downvotes, created_at`,
        [postId, content.trim(), user.id, is_anonymous ?? false]
      );

      // Increment reply_count on parent post
      await db.query(
        'UPDATE forum_posts SET reply_count = reply_count + 1, updated_at = NOW() WHERE id = $1',
        [postId]
      );

      const reply = result.rows[0];
      const uRow = await db.query(
        'SELECT username, forum_anon_handle FROM users WHERE id = $1',
        [user.id]
      );
      reply.author = displayName(uRow.rows[0], reply.is_anonymous);
      reply.my_vote = null;
      reply.is_own = true;

      return c.json(reply, 201);
    } catch (err: any) {
      console.error('forum createReply error', err);
      return c.json({ error: 'Failed to post reply' }, 500);
    }
  }

  // ─── DELETE /api/forum/replies/:id ───────────────────────
  async deleteReply(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const replyId = parseInt(c.req.param('id')!);
      if (isNaN(replyId)) return c.json({ error: 'Invalid reply id' }, 400);

      const result = await db.query(
        'SELECT author_id, post_id FROM forum_replies WHERE id = $1',
        [replyId]
      );
      if (!result.rows.length) return c.json({ error: 'Reply not found' }, 404);

      const isMod = TRUST_RANK[user.trust_level ?? 'basic'] >= TRUST_RANK['moderator'];
      if (result.rows[0].author_id !== user.id && !isMod) {
        return c.json({ error: 'Not authorized to delete this reply' }, 403);
      }

      const postId = result.rows[0].post_id;
      await db.query('DELETE FROM forum_replies WHERE id = $1', [replyId]);
      await db.query(
        'UPDATE forum_posts SET reply_count = GREATEST(reply_count - 1, 0), updated_at = NOW() WHERE id = $1',
        [postId]
      );

      return c.json({ message: 'Reply deleted' }, 200);
    } catch (err: any) {
      console.error('forum deleteReply error', err);
      return c.json({ error: 'Failed to delete reply' }, 500);
    }
  }

  // ─── POST /api/forum/posts/:id/vote ──────────────────────
  async votePost(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const postId = parseInt(c.req.param('id')!);
      if (isNaN(postId)) return c.json({ error: 'Invalid post id' }, 400);

      const { vote_type } = await c.req.json();
      if (!['up', 'down'].includes(vote_type)) {
        return c.json({ error: 'vote_type must be "up" or "down"' }, 400);
      }

      // Check existing vote
      const existing = await db.query(
        `SELECT id, vote_type FROM forum_votes
         WHERE user_id=$1 AND target_type='post' AND target_id=$2`,
        [user.id, postId]
      );

      if (existing.rows.length > 0) {
        const prev = existing.rows[0].vote_type;
        if (prev === vote_type) {
          // Toggle off — remove vote
          await db.query('DELETE FROM forum_votes WHERE id = $1', [existing.rows[0].id]);
          await db.query(
            `UPDATE forum_posts SET
               upvotes   = upvotes   - CASE WHEN $1='up'   THEN 1 ELSE 0 END,
               downvotes = downvotes - CASE WHEN $1='down' THEN 1 ELSE 0 END
             WHERE id = $2`,
            [vote_type, postId]
          );
        } else {
          // Switch vote
          await db.query(
            'UPDATE forum_votes SET vote_type=$1 WHERE id=$2',
            [vote_type, existing.rows[0].id]
          );
          await db.query(
            `UPDATE forum_posts SET
               upvotes   = upvotes   + CASE WHEN $1='up'   THEN 1 ELSE -1 END,
               downvotes = downvotes + CASE WHEN $1='down' THEN 1 ELSE -1 END
             WHERE id = $2`,
            [vote_type, postId]
          );
        }
      } else {
        // New vote
        await db.query(
          `INSERT INTO forum_votes (user_id, target_type, target_id, vote_type)
           VALUES ($1, 'post', $2, $3)`,
          [user.id, postId, vote_type]
        );
        await db.query(
          `UPDATE forum_posts SET
             upvotes   = upvotes   + CASE WHEN $1='up'   THEN 1 ELSE 0 END,
             downvotes = downvotes + CASE WHEN $1='down' THEN 1 ELSE 0 END
           WHERE id = $2`,
          [vote_type, postId]
        );
      }

      const updated = await db.query(
        'SELECT upvotes, downvotes FROM forum_posts WHERE id = $1',
        [postId]
      );
      const newVoteRow = await db.query(
        `SELECT vote_type FROM forum_votes WHERE user_id=$1 AND target_type='post' AND target_id=$2`,
        [user.id, postId]
      );

      return c.json({
        upvotes: updated.rows[0]?.upvotes ?? 0,
        downvotes: updated.rows[0]?.downvotes ?? 0,
        my_vote: newVoteRow.rows[0]?.vote_type ?? null,
      }, 200);
    } catch (err: any) {
      console.error('forum votePost error', err);
      return c.json({ error: 'Failed to record vote' }, 500);
    }
  }

  // ─── POST /api/forum/replies/:id/vote ────────────────────
  async voteReply(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const replyId = parseInt(c.req.param('id')!);
      if (isNaN(replyId)) return c.json({ error: 'Invalid reply id' }, 400);

      const { vote_type } = await c.req.json();
      if (!['up', 'down'].includes(vote_type)) {
        return c.json({ error: 'vote_type must be "up" or "down"' }, 400);
      }

      const existing = await db.query(
        `SELECT id, vote_type FROM forum_votes
         WHERE user_id=$1 AND target_type='reply' AND target_id=$2`,
        [user.id, replyId]
      );

      if (existing.rows.length > 0) {
        const prev = existing.rows[0].vote_type;
        if (prev === vote_type) {
          await db.query('DELETE FROM forum_votes WHERE id = $1', [existing.rows[0].id]);
          await db.query(
            `UPDATE forum_replies SET
               upvotes   = upvotes   - CASE WHEN $1='up'   THEN 1 ELSE 0 END,
               downvotes = downvotes - CASE WHEN $1='down' THEN 1 ELSE 0 END
             WHERE id = $2`,
            [vote_type, replyId]
          );
        } else {
          await db.query(
            'UPDATE forum_votes SET vote_type=$1 WHERE id=$2',
            [vote_type, existing.rows[0].id]
          );
          await db.query(
            `UPDATE forum_replies SET
               upvotes   = upvotes   + CASE WHEN $1='up'   THEN 1 ELSE -1 END,
               downvotes = downvotes + CASE WHEN $1='down' THEN 1 ELSE -1 END
             WHERE id = $2`,
            [vote_type, replyId]
          );
        }
      } else {
        await db.query(
          `INSERT INTO forum_votes (user_id, target_type, target_id, vote_type)
           VALUES ($1, 'reply', $2, $3)`,
          [user.id, replyId, vote_type]
        );
        await db.query(
          `UPDATE forum_replies SET
             upvotes   = upvotes   + CASE WHEN $1='up'   THEN 1 ELSE 0 END,
             downvotes = downvotes + CASE WHEN $1='down' THEN 1 ELSE 0 END
           WHERE id = $2`,
          [vote_type, replyId]
        );
      }

      const updated = await db.query(
        'SELECT upvotes, downvotes FROM forum_replies WHERE id = $1',
        [replyId]
      );
      const newVoteRow = await db.query(
        `SELECT vote_type FROM forum_votes WHERE user_id=$1 AND target_type='reply' AND target_id=$2`,
        [user.id, replyId]
      );

      return c.json({
        upvotes: updated.rows[0]?.upvotes ?? 0,
        downvotes: updated.rows[0]?.downvotes ?? 0,
        my_vote: newVoteRow.rows[0]?.vote_type ?? null,
      }, 200);
    } catch (err: any) {
      console.error('forum voteReply error', err);
      return c.json({ error: 'Failed to record vote' }, 500);
    }
  }

  // ─── PUT /api/forum/anon-handle ──────────────────────────
  async setAnonHandle(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { handle } = await c.req.json();
      const trimmed = (handle ?? '').trim();

      if (!trimmed) return c.json({ error: 'Handle cannot be empty' }, 400);
      if (trimmed.length < 3 || trimmed.length > 40) {
        return c.json({ error: 'Handle must be 3–40 characters' }, 400);
      }
      if (!/^[a-zA-Z0-9_.\-]+$/.test(trimmed)) {
        return c.json({ error: 'Handle may only contain letters, numbers, _, ., -' }, 400);
      }

      try {
        await db.query(
          'UPDATE users SET forum_anon_handle = $1 WHERE id = $2',
          [trimmed, user.id]
        );
      } catch (err: any) {
        if (err.code === '23505') {
          return c.json({ error: 'That handle is already taken' }, 409);
        }
        throw err;
      }

      return c.json({ forum_anon_handle: trimmed }, 200);
    } catch (err: any) {
      console.error('forum setAnonHandle error', err);
      return c.json({ error: 'Failed to update handle' }, 500);
    }
  }
}

export default new ForumController();
