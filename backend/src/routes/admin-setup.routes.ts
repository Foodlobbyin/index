/**
 * Admin Setup Route — ONE TIME USE ONLY
 * POST /api/setup/admin
 *
 * Allows the owner to register their private admin credentials
 * on first launch. Once an admin with a password exists, this
 * route returns 403 permanently.
 *
 * Protected by ADMIN_SETUP_KEY secret (set via wrangler secret put ADMIN_SETUP_KEY).
 */

import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';

const router = new Hono<AppBindings>();

router.post('/admin', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);

  try {
    const body = await c.req.json();
    const { username, email, password, confirm_password, setup_key } = body;

    // ── 1. Verify setup key ────────────────────────────────────────────────
    const expectedKey = (c.env as any).ADMIN_SETUP_KEY;
    if (!expectedKey) {
      return c.json(
        { error: 'Admin setup is not configured. Set the ADMIN_SETUP_KEY secret first.' },
        503
      );
    }
    if (!setup_key || setup_key !== expectedKey) {
      return c.json({ error: 'Invalid setup key.' }, 403);
    }

    // ── 2. Check if admin with password already exists (one-time guard) ───
    const existing = await db.query(
      `SELECT id FROM users WHERE trust_level = 'admin' AND password_hash IS NOT NULL LIMIT 1`
    );
    if (existing.rows.length > 0) {
      return c.json(
        { error: 'Admin account already set up. This route is permanently disabled.' },
        403
      );
    }

    // ── 3. Validate inputs ─────────────────────────────────────────────────
    if (!username || username.length < 3 || username.length > 50) {
      return c.json({ error: 'Username must be 3–50 characters.' }, 400);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return c.json({ error: 'Username may only contain letters, numbers, and underscores.' }, 400);
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: 'Valid email is required.' }, 400);
    }
    if (!password || password.length < 10) {
      return c.json({ error: 'Password must be at least 10 characters.' }, 400);
    }
    if (password !== confirm_password) {
      return c.json({ error: 'Passwords do not match.' }, 400);
    }
    // Basic strength check
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
      return c.json(
        { error: 'Password must contain at least one uppercase letter, one number, and one special character.' },
        400
      );
    }

    // ── 4. Check username / email uniqueness ───────────────────────────────
    const [dupUsername, dupEmail] = await Promise.all([
      db.query('SELECT id FROM users WHERE username = $1', [username]),
      db.query('SELECT id FROM users WHERE email = $1', [email]),
    ]);

    // ── 5. Hash password ───────────────────────────────────────────────────
    const password_hash = await bcrypt.hash(password, 12);

    // ── 6. Update or create admin ──────────────────────────────────────────
    // If placeholder admin row exists (no password), update it in place.
    const placeholder = await db.query(
      `SELECT id FROM users WHERE trust_level = 'admin' AND password_hash IS NULL LIMIT 1`
    );

    if (placeholder.rows.length > 0) {
      const adminId = placeholder.rows[0].id;

      // Check uniqueness only against OTHER users
      if (dupUsername.rows.length > 0 && dupUsername.rows[0].id !== adminId) {
        return c.json({ error: 'Username already taken.' }, 409);
      }
      if (dupEmail.rows.length > 0 && dupEmail.rows[0].id !== adminId) {
        return c.json({ error: 'Email already in use.' }, 409);
      }

      await db.query(
        `UPDATE users
         SET username = $1,
             email = $2,
             password_hash = $3,
             account_activated = TRUE,
             email_verified = TRUE,
             registration_status = 'active'
         WHERE id = $4`,
        [username, email, password_hash, adminId]
      );

      return c.json({
        message: 'Admin account configured successfully. You can now log in.',
        username,
        email,
      }, 200);
    }

    // No placeholder row — create fresh admin account
    if (dupUsername.rows.length > 0) {
      return c.json({ error: 'Username already taken.' }, 409);
    }
    if (dupEmail.rows.length > 0) {
      return c.json({ error: 'Email already in use.' }, 409);
    }

    await db.query(
      `INSERT INTO users
         (username, email, password_hash, trust_level, account_activated,
          email_verified, registration_status, can_send_invites)
       VALUES ($1, $2, $3, 'admin', TRUE, TRUE, 'active', TRUE)`,
      [username, email, password_hash]
    );

    return c.json({
      message: 'Admin account created successfully. You can now log in.',
      username,
      email,
    }, 201);

  } catch (err: any) {
    console.error('Admin setup error:', err);
    return c.json({ error: 'Setup failed. Please try again.' }, 500);
  }
});

export default router;
