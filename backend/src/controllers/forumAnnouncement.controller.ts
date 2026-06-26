import type { Context } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';

export class ForumAnnouncementController {

  // ── GET /api/forum/announcements ─────────────────────────
  // Returns all entries ordered by posted_at DESC (newest first).
  // Available to every authenticated user regardless of trust level.
  async getAnnouncements(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const result = await db.query(
        `SELECT
           fa.id, fa.title, fa.content, fa.posted_at,
           fa.created_at, fa.updated_at,
           u.username AS author
         FROM forum_announcements fa
         JOIN users u ON u.id = fa.author_id
         ORDER BY fa.posted_at DESC`,
        []
      );

      return c.json({ announcements: result.rows }, 200);
    } catch (err: any) {
      console.error('getAnnouncements error', err);
      return c.json({ error: 'Failed to load announcements' }, 500);
    }
  }

  // ── POST /api/forum/announcements ────────────────────────
  // Admin only. Creates a new announcement entry.
  async createAnnouncement(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);
      if (user.trust_level !== 'admin') return c.json({ error: 'Admin only' }, 403);

      const body = await c.req.json();
      const { title, content, posted_at } = body;

      if (!title?.trim()) return c.json({ error: 'Title is required' }, 400);
      if (!content?.trim()) return c.json({ error: 'Content is required' }, 400);

      // Allow admin to set a custom posted_at (for backdating). Defaults to NOW().
      const effectivePostedAt = posted_at ? new Date(posted_at).toISOString() : new Date().toISOString();

      const result = await db.query(
        `INSERT INTO forum_announcements (title, content, posted_at, author_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, title, content, posted_at, created_at, updated_at`,
        [title.trim(), content.trim(), effectivePostedAt, user.id]
      );

      const row = result.rows[0];
      return c.json({ ...row, author: user.username }, 201);
    } catch (err: any) {
      console.error('createAnnouncement error', err);
      return c.json({ error: 'Failed to create announcement' }, 500);
    }
  }

  // ── PUT /api/forum/announcements/:id ─────────────────────
  // Admin only. Update title, content, or posted_at of an existing entry.
  async updateAnnouncement(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);
      if (user.trust_level !== 'admin') return c.json({ error: 'Admin only' }, 403);

      const id = parseInt(c.req.param('id')!);
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

      const body = await c.req.json();
      const { title, content, posted_at } = body;

      // Build dynamic SET clause — only update provided fields
      const setClauses: string[] = [];
      const params: (string | number)[] = [];

      if (title !== undefined) {
        if (!title.trim()) return c.json({ error: 'Title cannot be empty' }, 400);
        params.push(title.trim());
        setClauses.push(`title = $${params.length}`);
      }
      if (content !== undefined) {
        if (!content.trim()) return c.json({ error: 'Content cannot be empty' }, 400);
        params.push(content.trim());
        setClauses.push(`content = $${params.length}`);
      }
      if (posted_at !== undefined) {
        params.push(new Date(posted_at).toISOString());
        setClauses.push(`posted_at = $${params.length}`);
      }

      if (setClauses.length === 0) return c.json({ error: 'Nothing to update' }, 400);

      params.push(id);
      const result = await db.query(
        `UPDATE forum_announcements
         SET ${setClauses.join(', ')}
         WHERE id = $${params.length}
         RETURNING id, title, content, posted_at, created_at, updated_at`,
        params
      );

      if (!result.rows.length) return c.json({ error: 'Announcement not found' }, 404);

      return c.json({ ...result.rows[0], author: user.username }, 200);
    } catch (err: any) {
      console.error('updateAnnouncement error', err);
      return c.json({ error: 'Failed to update announcement' }, 500);
    }
  }

  // ── DELETE /api/forum/announcements/:id ──────────────────
  // Admin only.
  async deleteAnnouncement(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);
      if (user.trust_level !== 'admin') return c.json({ error: 'Admin only' }, 403);

      const id = parseInt(c.req.param('id')!);
      if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

      const result = await db.query(
        'DELETE FROM forum_announcements WHERE id = $1 RETURNING id',
        [id]
      );

      if (!result.rows.length) return c.json({ error: 'Announcement not found' }, 404);

      return c.json({ message: 'Deleted' }, 200);
    } catch (err: any) {
      console.error('deleteAnnouncement error', err);
      return c.json({ error: 'Failed to delete announcement' }, 500);
    }
  }
}

export default new ForumAnnouncementController();
