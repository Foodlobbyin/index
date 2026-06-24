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
import healthRoutes from './routes/health';
import { apiLimiter } from './middleware/rateLimiter';

const app = new Hono<AppBindings>();

// CORS for all routes.
app.use('*', cors());

// TODO(swagger): Swagger/OpenAPI docs are not yet wired up for the Workers
// runtime. The previous Express setup used swagger-jsdoc + swagger-ui-express,
// which are not Workers-compatible. Re-introduce via a Workers-friendly
// approach (e.g. serving a pre-generated OpenAPI JSON) in a later phase.

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
      referralSystem: true,
      otpVerification: true,
      gstnValidation: true,
      incidentManagement: true,
    },
  });
});

// Routes
app.route('/api/health', healthRoutes);
app.route('/api/auth', authRoutes); // Legacy auth routes
app.route('/api/secure-auth', secureAuthRoutes); // New secure auth routes with referral
app.route('/api/referrals', referralRoutes); // Referral management routes
app.route('/api/company', companyRoutes);
app.route('/api/invoices', invoiceRoutes);
app.route('/api/insights', insightsRoutes);
app.route('/api/incidents', incidentRoutes);
app.route('/api/moderation', moderationRoutes);
app.route('/api/reputation', reputationRoutes);
app.route('/api/audit-logs', auditLogRoutes);
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
