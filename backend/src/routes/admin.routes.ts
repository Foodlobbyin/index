import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import { authenticate, requireMinTrustLevel } from '../middleware/auth.middleware';
import inviteTokenRepository from '../repositories/inviteToken.repository';
import waitlistRepository from '../repositories/waitlist.repository';
import emailService from '../services/email.service';

const router = new Hono<AppBindings>();

// All admin routes require authentication + admin trust level
router.use('*', authenticate, requireMinTrustLevel('admin'));

/**
 * GET /api/admin/stats
 * Dashboard stats
 */
router.get('/stats', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const [users, pending, waitlist, invites] = await Promise.all([
    db.query(`SELECT COUNT(*) FROM users WHERE registration_status = 'active'`),
    db.query(`SELECT COUNT(*) FROM users WHERE registration_status = 'pending_review'`),
    db.query(`SELECT COUNT(*) FROM waitlist WHERE status = 'waiting'`),
    db.query(`SELECT COUNT(*) FROM invite_tokens WHERE status = 'pending' AND expires_at > NOW()`),
  ]);
  return c.json({
    active_users: parseInt(users.rows[0].count),
    pending_review: parseInt(pending.rows[0].count),
    waitlist: parseInt(waitlist.rows[0].count),
    active_invites: parseInt(invites.rows[0].count),
  });
});

/**
 * GET /api/admin/pending
 * List users pending review (registered via member invite)
 */
router.get('/pending', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const result = await db.query(
    `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.gstn, u.phone_number,
            u.created_at, u.registration_status,
            inv.invited_email, inv.type as invite_type,
            inviter.username as invited_by_username
     FROM users u
     LEFT JOIN invite_tokens inv ON inv.id = u.invite_token_id
     LEFT JOIN users inviter ON inviter.id = inv.invited_by_user_id
     WHERE u.registration_status = 'pending_review'
     ORDER BY u.created_at DESC`
  );
  return c.json({ users: result.rows });
});

/**
 * POST /api/admin/approve/:userId
 * Approve a pending user
 */
router.post('/approve/:userId', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const userId = parseInt(c.req.param('userId'));
  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user.rows[0]) return c.json({ error: 'User not found' }, 404);
  if (user.rows[0].registration_status !== 'pending_review') {
    return c.json({ error: 'User is not pending review.' }, 400);
  }

  await db.query(
    `UPDATE users SET registration_status = 'active', account_activated = TRUE, trust_level = 'basic' WHERE id = $1`,
    [userId]
  );

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(
      c.env.RESEND_API_KEY,
      c.env.EMAIL_FROM || 'noreply@foodlobby.in',
      user.rows[0].email,
      user.rows[0].first_name || user.rows[0].username
    );
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }

  return c.json({ message: 'User approved and notified.' });
});

/**
 * POST /api/admin/decline/:userId
 * Decline a pending user
 */
router.post('/decline/:userId', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const userId = parseInt(c.req.param('userId'));
  const { reason } = await c.req.json().catch(() => ({ reason: '' }));

  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user.rows[0]) return c.json({ error: 'User not found' }, 404);

  await db.query(
    `UPDATE users SET registration_status = 'declined', account_activated = FALSE WHERE id = $1`,
    [userId]
  );

  // Notify user
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${c.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: c.env.EMAIL_FROM || 'noreply@foodlobby.in',
        to: [user.rows[0].email],
        subject: 'Your Foodlobby application update',
        html: `<p>Dear ${user.rows[0].first_name || user.rows[0].username},</p><p>After reviewing your application, we are unable to approve your Foodlobby account at this time.</p>${reason ? `<p>Reason: ${reason}</p>` : ''}<p>If you believe this is an error, please contact us.</p>`,
      }),
    });
  } catch (err) {
    console.error('Failed to send decline email:', err);
  }

  return c.json({ message: 'User declined and notified.' });
});

/**
 * GET /api/admin/waitlist
 * View waitlist entries
 */
router.get('/waitlist', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const status = c.req.query('status') || 'waiting';
  const entries = await waitlistRepository.list(db, status);
  return c.json({ entries });
});

/**
 * POST /api/admin/waitlist/:id/invite
 * Send marketing invite to a waitlist person
 */
router.post('/waitlist/:id/invite', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const id = parseInt(c.req.param('id'));
  const entry = await waitlistRepository.findById(db, id);
  if (!entry) return c.json({ error: 'Waitlist entry not found.' }, 404);
  if (entry.status !== 'waiting') return c.json({ error: 'This person has already been invited or registered.' }, 400);

  // Check for existing active invite
  const existing = await db.query(
    `SELECT id FROM invite_tokens WHERE invited_email = $1 AND status = 'pending' AND expires_at > NOW()`,
    [entry.email]
  );
  if (existing.rows.length > 0) {
    return c.json({ error: 'An active invite already exists for this email.' }, 409);
  }

  const invite = await inviteTokenRepository.create(db, {
    type: 'marketing',
    invited_email: entry.email,
    invited_by_user_id: null,
  });

  await waitlistRepository.markInvited(db, id, invite.id);

  const inviteUrl = `${c.env.FRONTEND_URL}/register?invite=${invite.token}`;

  // Send invite email
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${c.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: c.env.EMAIL_FROM || 'noreply@foodlobby.in',
        to: [entry.email],
        subject: 'You are invited to join Foodlobby',
        html: `<div style="font-family:sans-serif;max-width:520px;margin:auto"><h2 style="color:#16a34a">Welcome to Foodlobby</h2><p>Hi ${entry.first_name},</p><p>Great news! Our team has reviewed your waitlist application and would like to invite you to join the Foodlobby B2B community.</p><a href="${inviteUrl}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#16a34a;color:white;border-radius:6px;text-decoration:none;font-weight:bold">Accept Invite & Register</a><p style="color:#6b7280;font-size:13px">This link is valid for 30 days, single-use, and tied to this email address.</p></div>`,
      }),
    });
  } catch (err) {
    console.error('Failed to send invite email:', err);
  }

  return c.json({ message: 'Invite sent to waitlist member.', invite_url: inviteUrl });
});

/**
 * POST /api/admin/waitlist/:id/decline
 * Decline a waitlist entry
 */
router.post('/waitlist/:id/decline', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const id = parseInt(c.req.param('id'));
  await waitlistRepository.markDeclined(db, id);
  return c.json({ message: 'Waitlist entry declined.' });
});

/**
 * GET /api/admin/users
 * All users list
 */
router.get('/users', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const result = await db.query(
    `SELECT id, username, email, first_name, last_name, gstn, trust_level,
            registration_status, account_activated, email_verified,
            can_send_invites, created_at
     FROM users ORDER BY created_at DESC`
  );
  return c.json({ users: result.rows });
});

/**
 * PATCH /api/admin/users/:id/toggle-invites
 * Enable or disable a user's ability to send invites
 */
router.patch('/users/:id/toggle-invites', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const userId = parseInt(c.req.param('id'));
  const { enabled } = await c.req.json();
  await db.query('UPDATE users SET can_send_invites = $1 WHERE id = $2', [enabled, userId]);
  return c.json({ message: `Invite privileges ${enabled ? 'enabled' : 'disabled'}.` });
});

/**
 * PATCH /api/admin/users/:id/trust-level
 * Change a user's trust level
 */
router.patch('/users/:id/trust-level', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const userId = parseInt(c.req.param('id'));
  const { trust_level } = await c.req.json();
  const valid = ['basic', 'verified', 'trusted', 'moderator', 'admin'];
  if (!valid.includes(trust_level)) return c.json({ error: 'Invalid trust level.' }, 400);
  await db.query('UPDATE users SET trust_level = $1 WHERE id = $2', [trust_level, userId]);
  return c.json({ message: `Trust level updated to ${trust_level}.` });
});

/**
 * GET /api/admin/invites
 * List all invite tokens
 */
router.get('/invites', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const result = await db.query(
    `SELECT it.*, u.username as invited_by_username
     FROM invite_tokens it
     LEFT JOIN users u ON u.id = it.invited_by_user_id
     ORDER BY it.created_at DESC LIMIT 100`
  );
  return c.json({ invites: result.rows });
});

/**
 * DELETE /api/admin/invites/:id/revoke
 */
router.delete('/invites/:id/revoke', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const id = parseInt(c.req.param('id'));
  await inviteTokenRepository.revoke(db, id);
  return c.json({ message: 'Invite revoked.' });
});

export default router;
