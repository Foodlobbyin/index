import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
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

/**
 * PATCH /api/admin/profile
 * Update admin username and email
 */
router.patch('/profile', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const user = c.get('user');
  const { username, email } = await c.req.json();

  if (!username || username.length < 3 || username.length > 50) {
    return c.json({ error: 'Username must be 3–50 characters.' }, 400);
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return c.json({ error: 'Username may only contain letters, numbers, and underscores.' }, 400);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Valid email is required.' }, 400);
  }

  // Check uniqueness against other users
  const [dupU, dupE] = await Promise.all([
    db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, user.id]),
    db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, user.id]),
  ]);
  if (dupU.rows.length > 0) return c.json({ error: 'Username already taken.' }, 409);
  if (dupE.rows.length > 0) return c.json({ error: 'Email already in use.' }, 409);

  await db.query(
    'UPDATE users SET username = $1, email = $2 WHERE id = $3',
    [username, email, user.id]
  );
  return c.json({ message: 'Profile updated successfully.' });
});

/**
 * PATCH /api/admin/profile/password
 * Change admin password (requires current password verification)
 */
router.patch('/profile/password', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const user = c.get('user');
  const { current_password, new_password } = await c.req.json();

  if (!current_password || !new_password) {
    return c.json({ error: 'Current and new password are required.' }, 400);
  }
  if (new_password.length < 10) {
    return c.json({ error: 'Password must be at least 10 characters.' }, 400);
  }
  if (!/[A-Z]/.test(new_password) || !/[0-9]/.test(new_password) || !/[^a-zA-Z0-9]/.test(new_password)) {
    return c.json({ error: 'Password needs 1 uppercase, 1 number, 1 special character.' }, 400);
  }

  const row = await db.query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
  if (!row.rows[0]?.password_hash) {
    return c.json({ error: 'No password set on this account.' }, 400);
  }

  const valid = await bcrypt.compare(current_password, row.rows[0].password_hash);
  if (!valid) return c.json({ error: 'Current password is incorrect.' }, 401);

  const new_hash = await bcrypt.hash(new_password, 12);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [new_hash, user.id]);
  return c.json({ message: 'Password changed successfully.' });
});


/**
 * POST /api/admin/invite-direct
 * Admin-only: generate an invite token AND immediately send a personalised
 * marketing email to the recipient. Accepts first_name, company_name, email.
 */
router.post('/invite-direct', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);

  let body: { first_name?: string; company_name?: string; email?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body.' }, 400);
  }

  const { first_name, company_name, email } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'A valid email address is required.' }, 400);
  }
  if (!first_name || first_name.trim().length < 2) {
    return c.json({ error: 'First name (min 2 characters) is required.' }, 400);
  }

  // Prevent duplicate active invites to the same email
  const existing = await db.query(
    `SELECT id FROM invite_tokens
     WHERE invited_email = $1 AND status = 'pending' AND expires_at > NOW()`,
    [email.toLowerCase()]
  );
  if (existing.rows.length > 0) {
    return c.json({ error: 'An active invite already exists for this email address.' }, 409);
  }

  // Create the invite token
  const invite = await inviteTokenRepository.create(db, {
    type: 'marketing',
    invited_email: email.toLowerCase(),
    invited_by_user_id: null,
  });

  const frontendUrl = (c.env as any).FRONTEND_URL || 'https://foodlobby.in';
  const inviteUrl = `${frontendUrl}/register?invite=${invite.token}`;
  const name = first_name.trim();
  const company = company_name?.trim() || '';
  const year = new Date().getFullYear();

  // Branded, personalised marketing email HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>You're invited to Foodlobby</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.10)">

    <!-- Header banner -->
    <div style="background:linear-gradient(135deg,#15803d 0%,#166534 100%);padding:36px 44px;text-align:center">
      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px">🌿 Foodlobby</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:0.3px">
        India's Verified B2B Food &amp; Spice Commodity Network
      </p>
    </div>

    <!-- Body -->
    <div style="padding:40px 44px">

      <!-- Greeting -->
      <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827">
        Dear ${name},
      </p>
      ${company ? `<p style="margin:0 0 24px;font-size:14px;color:#6b7280">Representing <strong style="color:#374151">${company}</strong></p>` : '<div style="margin-bottom:24px"></div>'}

      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151">
        We are delighted to personally invite you to <strong>Foodlobby</strong> — an exclusive,
        invite-only B2B platform built for verified food &amp; spice commodity professionals across India.
      </p>

      <!-- Feature pills -->
      <div style="background:#f9fafb;border-radius:10px;padding:20px 24px;margin-bottom:24px;border:1px solid #e5e7eb">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px">What you get as a member</p>
        <table style="border-collapse:collapse;width:100%">
          <tr>
            <td style="padding:5px 0;font-size:14px;color:#374151;width:50%">✅ Verified company directory</td>
            <td style="padding:5px 0;font-size:14px;color:#374151">✅ Invoice &amp; payment tracker</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:14px;color:#374151">✅ Incident &amp; fraud reporting</td>
            <td style="padding:5px 0;font-size:14px;color:#374151">✅ Reputation management</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:14px;color:#374151" colspan="2">✅ Community forum for commodity professionals</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0">
        <a href="${inviteUrl}"
           style="display:inline-block;padding:15px 42px;background:#15803d;color:#ffffff;border-radius:9px;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 3px 10px rgba(21,128,61,0.35)">
          Accept Invitation &amp; Register →
        </a>
      </div>

      <!-- Notice box -->
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 18px;margin-bottom:28px">
        <p style="margin:0;font-size:12px;color:#166534;line-height:1.7">
          <strong>Please note:</strong> This invitation link is <strong>valid for 30 days</strong>,
          single-use only, and is reserved for <strong>${email.toLowerCase()}</strong>.
          You must register using this exact email address.
          If the link expires, you can request a fresh invite from the registration page.
        </p>
      </div>

      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6">
        If you received this by mistake or do not wish to join, simply ignore this email.
        No account will be created without your action.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 44px;text-align:center">
      <p style="margin:0 0 6px;font-size:12px;color:#9ca3af">
        &copy; ${year} Foodlobby &nbsp;&middot;&nbsp;
        <a href="https://foodlobby.in" style="color:#15803d;text-decoration:none">foodlobby.in</a>
        &nbsp;&middot;&nbsp; Junagadh, Gujarat, India
      </p>
      <p style="margin:0;font-size:11px;color:#d1d5db">
        This is an invite-only platform. You were personally selected by our team.
      </p>
    </div>
  </div>
</body>
</html>`;

  // Send via Resend
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: (c.env as any).EMAIL_FROM || 'noreply@foodlobby.in',
        to: [email.toLowerCase()],
        subject: `${name}, you're personally invited to join Foodlobby`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend error:', res.status, errText);
      return c.json({
        message: 'Invite token created but email delivery failed. Copy the link to send manually.',
        invite_url: inviteUrl,
        token: invite.token,
        email_sent: false,
        email_error: `Resend ${res.status}: ${errText}`,
      }, 207);
    }
  } catch (emailErr: any) {
    console.error('Email send error:', emailErr);
    return c.json({
      message: 'Invite token created but email delivery failed.',
      invite_url: inviteUrl,
      token: invite.token,
      email_sent: false,
    }, 207);
  }

  return c.json({
    message: `Invitation email sent successfully to ${email}.`,
    invite_url: inviteUrl,
    token: invite.token,
    email_sent: true,
  }, 201);
});

export default router;
