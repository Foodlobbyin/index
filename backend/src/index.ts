import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';
import type { AppBindings } from './types/env';
import { createDbClient } from './config/database';
import authRoutes from './routes/auth.routes';
import secureAuthRoutes from './routes/secure-auth.routes';
import referralRoutes from './routes/referral.routes';
import companyRoutes from './routes/company.routes';
import invoiceRoutes from './routes/invoice.routes';
import insightsRoutes from './routes/insights.routes';
import incidentRoutes from './routes/incident.routes';
import moderationRoutes from './routes/moderation.routes';
import reputationRoutes from './routes/reputation.routes';
import auditLogRoutes from './routes/auditLog.routes';
import adminRoutes from './routes/admin.routes';
import inviteRoutes from './routes/invite.routes';
import waitlistRoutes from './routes/waitlist.routes';
import contactRoutes from './routes/contact.routes';
import healthRoutes from './routes/health';
import pendingEditsRouter from './routes/pendingEdits.routes';
import forumRoutes from './routes/forum.routes';
import profileRoutes from './routes/profile.routes';
import { apiLimiter } from './middleware/rateLimiter';

const app = new Hono<AppBindings>();

// CORS for all routes.
app.use('*', cors());

// Apply general rate limiting to all API routes.
app.use('/api/*', apiLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// ONE-TIME ADMIN SETUP  —  POST /api/setup/admin
// No auth guard. Gated by ADMIN_SETUP_KEY secret.
// Permanently disabled once an admin with a password exists.
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/setup/admin', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  try {
    const body = await c.req.json();
    const { username, email, password, confirm_password, setup_key } = body;

    // 1. Verify setup key
    const expectedKey = (c.env as any).ADMIN_SETUP_KEY as string | undefined;
    if (!expectedKey) {
      return c.json(
        { error: 'Admin setup is not configured. Set the ADMIN_SETUP_KEY Worker secret first.' },
        503
      );
    }
    if (!setup_key || setup_key !== expectedKey) {
      return c.json({ error: 'Invalid setup key.' }, 403);
    }

    // 2. One-time guard — block if admin with password already exists
    const existing = await db.query(
      `SELECT id FROM users WHERE trust_level = 'admin' AND password_hash IS NOT NULL LIMIT 1`
    );
    if (existing.rows.length > 0) {
      return c.json(
        { error: 'Admin account already configured. This route is permanently disabled.' },
        403
      );
    }

    // 3. Validate inputs
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
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
      return c.json(
        { error: 'Password must contain at least one uppercase letter, one number, and one special character.' },
        400
      );
    }

    // 4. Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // 5. Update placeholder admin row (no password) or create fresh
    const placeholder = await db.query(
      `SELECT id FROM users WHERE trust_level = 'admin' AND password_hash IS NULL LIMIT 1`
    );

    if (placeholder.rows.length > 0) {
      const adminId = placeholder.rows[0].id;

      // Check uniqueness against OTHER users
      const [dupU, dupE] = await Promise.all([
        db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, adminId]),
        db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, adminId]),
      ]);
      if (dupU.rows.length > 0) return c.json({ error: 'Username already taken.' }, 409);
      if (dupE.rows.length > 0) return c.json({ error: 'Email already in use.' }, 409);

      await db.query(
        `UPDATE users
         SET username = $1, email = $2, password_hash = $3,
             account_activated = TRUE, email_verified = TRUE, registration_status = 'active'
         WHERE id = $4`,
        [username, email, password_hash, adminId]
      );
    } else {
      // No placeholder — create fresh admin
      const [dupU, dupE] = await Promise.all([
        db.query('SELECT id FROM users WHERE username = $1', [username]),
        db.query('SELECT id FROM users WHERE email = $1', [email]),
      ]);
      if (dupU.rows.length > 0) return c.json({ error: 'Username already taken.' }, 409);
      if (dupE.rows.length > 0) return c.json({ error: 'Email already in use.' }, 409);

      await db.query(
        `INSERT INTO users (username, email, password_hash, trust_level, account_activated,
                            email_verified, registration_status, can_send_invites)
         VALUES ($1, $2, $3, 'admin', TRUE, TRUE, 'active', TRUE)`,
        [username, email, password_hash]
      );
    }

    return c.json({
      message: 'Admin account configured. You can now log in at /login.',
      username,
      email,
    }, 200);

  } catch (err: any) {
    console.error('Admin setup error:', err);
    return c.json({ error: 'Setup failed. Please try again.' }, 500);
  }
});

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Foodlobbyin API',
    features: {
      secureRegistration: true,
      inviteSystem: true,
      waitlist: true,
      otpVerification: true,
      gstnValidation: true,
      incidentManagement: true,
    },
  });
});

// Routes
app.route('/api/health', healthRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/secure-auth', secureAuthRoutes);
app.route('/api/referrals', referralRoutes);
app.route('/api/invite', inviteRoutes);
app.route('/api/waitlist', waitlistRoutes);
app.route('/api/company', companyRoutes);
app.route('/api/contact', contactRoutes);
app.route('/api/invoices', invoiceRoutes);
app.route('/api/insights', insightsRoutes);
app.route('/api/incidents', incidentRoutes);
app.route('/api/moderation', moderationRoutes);
app.route('/api/reputation', reputationRoutes);
app.route('/api/audit-logs', auditLogRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/pending-edits', pendingEditsRouter);
app.route('/api/forum', forumRoutes);
app.route('/api/profile', profileRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Route not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
