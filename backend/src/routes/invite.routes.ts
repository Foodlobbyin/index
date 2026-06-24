import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import { authenticate, requireMinTrustLevel } from '../middleware/auth.middleware';
import inviteTokenRepository from '../repositories/inviteToken.repository';
import waitlistRepository from '../repositories/waitlist.repository';
import emailService from '../services/email.service';

const router = new Hono<AppBindings>();

/**
 * GET /api/invite/validate/:token
 * Public — frontend calls this when page loads with ?invite=TOKEN
 */
router.get('/validate/:token', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const token = c.req.param('token');
  const result = await inviteTokenRepository.validateToken(db, token);
  if (!result.valid) {
    return c.json({ valid: false, error: result.error }, 400);
  }
  return c.json({
    valid: true,
    invited_email: result.invite!.invited_email,
    type: result.invite!.type,
  });
});

/**
 * POST /api/invite/generate
 * Admin only — generate a marketing invite link
 */
router.post('/generate', authenticate, requireMinTrustLevel('admin'), async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const { email } = await c.req.json();
  if (!email) return c.json({ error: 'Email is required' }, 400);

  // Check if active invite already exists for this email
  const existing = await db.query(
    `SELECT id FROM invite_tokens WHERE invited_email = $1 AND status = 'pending' AND expires_at > NOW()`,
    [email.toLowerCase()]
  );
  if (existing.rows.length > 0) {
    return c.json({ error: 'An active invite already exists for this email.' }, 409);
  }

  const invite = await inviteTokenRepository.create(db, {
    type: 'marketing',
    invited_email: email,
    invited_by_user_id: null,
  });

  const inviteUrl = `${c.env.FRONTEND_URL}/register?invite=${invite.token}`;

  // Send invite email
  try {
    await sendInviteEmail(c.env.RESEND_API_KEY, c.env.EMAIL_FROM, email, inviteUrl, 'marketing', null);
  } catch (err) {
    console.error('Failed to send invite email:', err);
  }

  return c.json({ message: 'Invite sent.', invite_url: inviteUrl, token: invite.token }, 201);
});

/**
 * POST /api/invite/send
 * Authenticated users — send a member invite
 */
router.post('/send', authenticate, async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const user = c.get('user') as any;
  const { email } = await c.req.json();

  if (!email) return c.json({ error: 'Email is required' }, 400);

  // Check if user can send invites
  const userRow = await db.query('SELECT can_send_invites, username, first_name FROM users WHERE id = $1', [user.id]);
  if (!userRow.rows[0]?.can_send_invites) {
    return c.json({ error: 'Your invite privileges have been disabled.' }, 403);
  }

  // Prevent duplicate active invites
  const existing = await db.query(
    `SELECT id FROM invite_tokens WHERE invited_email = $1 AND status = 'pending' AND expires_at > NOW()`,
    [email.toLowerCase()]
  );
  if (existing.rows.length > 0) {
    return c.json({ error: 'An active invite already exists for this email.' }, 409);
  }

  const invite = await inviteTokenRepository.create(db, {
    type: 'member',
    invited_email: email,
    invited_by_user_id: user.id,
  });

  const inviteUrl = `${c.env.FRONTEND_URL}/register?invite=${invite.token}`;
  const senderName = userRow.rows[0]?.first_name || userRow.rows[0]?.username;

  try {
    await sendInviteEmail(c.env.RESEND_API_KEY, c.env.EMAIL_FROM, email, inviteUrl, 'member', senderName);
  } catch (err) {
    console.error('Failed to send invite email:', err);
  }

  return c.json({ message: 'Invite sent.', invite_url: inviteUrl }, 201);
});

/**
 * POST /api/invite/request-reinvite
 * Public — user whose invite expired can request a new one
 */
router.post('/request-reinvite', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const { token } = await c.req.json();
  if (!token) return c.json({ error: 'Token is required' }, 400);

  const invite = await inviteTokenRepository.findByToken(db, token);
  if (!invite) return c.json({ error: 'Invalid token.' }, 400);
  if (invite.status === 'used') return c.json({ error: 'This invite was already used.' }, 400);

  // Notify admin or original sender
  try {
    const adminEmail = c.env.EMAIL_FROM;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: c.env.EMAIL_FROM || 'noreply@foodlobby.in',
        to: [adminEmail],
        subject: 'Foodlobby — Expired Invite Re-request',
        html: `<p><strong>${invite.invited_email}</strong> has requested a new invite link. Their previous invite (${invite.type}) expired on ${new Date(invite.expires_at).toLocaleDateString('en-IN')}.</p><p>Please generate a new invite from the admin panel.</p>`,
      }),
    });
  } catch (err) {
    console.error('Failed to notify admin of re-invite request:', err);
  }

  return c.json({ message: 'Your request has been sent. You will receive a new invite shortly.' });
});

// Helper: send invite email
async function sendInviteEmail(
  apiKey: string,
  fromEmail: string,
  toEmail: string,
  inviteUrl: string,
  type: 'marketing' | 'member',
  senderName: string | null
) {
  const subject = type === 'marketing'
    ? 'You are invited to join Foodlobby'
    : `${senderName || 'A community member'} has invited you to Foodlobby`;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
      <div style="background:#15803d;padding:28px 32px;text-align:center">
        <h2 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">🌿 Foodlobby</h2>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:12px">India's Food &amp; Spice Trade Fraud Protection Network</p>
      </div>
      <div style="padding:28px 32px">
        ${type === 'member'
          ? `<p style="font-size:15px;color:#374151">You have been personally invited by <strong>${senderName}</strong> to join Foodlobby.</p>`
          : `<p style="font-size:15px;color:#374151">You have been personally selected by the Foodlobby team to join our platform.</p>`}
        <p style="font-size:15px;color:#374151;line-height:1.65">
          <strong>Foodlobby</strong> is a community-driven platform that helps food &amp; spice commodity
          professionals protect themselves from <strong>trade fraud, credit defaults, and payment scams</strong> in India.
          Search if a buyer has cheated others before you extend credit to them.
        </p>
        <div style="text-align:center;margin:28px 0">
          <a href="${inviteUrl}" style="display:inline-block;padding:13px 32px;background:#15803d;color:white;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Accept Invitation &amp; Register →</a>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:7px;padding:12px 16px">
          <p style="margin:0;font-size:12px;color:#166534">
            <strong>Note:</strong> This invite is valid for 30 days, single-use, and locked to <strong>${toEmail}</strong>.
            Please register using this email address.
          </p>
        </div>
      </div>
      <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center">
        <p style="margin:0;font-size:11px;color:#9ca3af">&copy; ${new Date().getFullYear()} Foodlobby &middot; <a href="https://foodlobby.in" style="color:#15803d;text-decoration:none">foodlobby.in</a></p>
      </div>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail || 'noreply@foodlobby.in',
      to: [toEmail],
      subject,
      html,
    }),
  });
}

export default router;
