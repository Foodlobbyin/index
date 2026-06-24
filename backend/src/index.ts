import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppBindings } from './types/env';
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
import adminSetupRoutes from './routes/admin-setup.routes';
import inviteRoutes from './routes/invite.routes';
import waitlistRoutes from './routes/waitlist.routes';
import healthRoutes from './routes/health';
import { apiLimiter } from './middleware/rateLimiter';

const app = new Hono<AppBindings>();

// CORS for all routes.
app.use('*', cors());

// Apply general rate limiting to all API routes.
app.use('/api/*', apiLimiter);

// Health check (kept inline to preserve the exact response shape).
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
app.route('/api/auth', authRoutes);               // Legacy auth routes
app.route('/api/secure-auth', secureAuthRoutes);  // Secure auth with invite-based registration
app.route('/api/referrals', referralRoutes);      // Legacy referral routes (kept for compat)
app.route('/api/invite', inviteRoutes);           // Invite token management
app.route('/api/waitlist', waitlistRoutes);       // Public waitlist signup
app.route('/api/company', companyRoutes);
app.route('/api/invoices', invoiceRoutes);
app.route('/api/insights', insightsRoutes);
app.route('/api/incidents', incidentRoutes);
app.route('/api/moderation', moderationRoutes);
app.route('/api/reputation', reputationRoutes);
app.route('/api/audit-logs', auditLogRoutes);
app.route('/api/setup', adminSetupRoutes); // one-time setup — separate path, no auth guard
app.route('/api/admin', adminRoutes);

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
