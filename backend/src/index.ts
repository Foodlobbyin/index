import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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
import healthRoutes from './routes/health';
import { apiLimiter } from './middleware/rateLimiter';
import { setupSwagger } from './config/swagger';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger documentation
setupSwagger(app);

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter as unknown as express.RequestHandler);

// Health check
/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: API health check
 *     description: Returns the health status of the API and enabled features
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: Foodlobbyin API
 *                 features:
 *                   type: object
 *                   properties:
 *                     secureRegistration:
 *                       type: boolean
 *                     referralSystem:
 *                       type: boolean
 *                     otpVerification:
 *                       type: boolean
 *                     gstnValidation:
 *                       type: boolean
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Foodlobbyin API',
    features: {
      secureRegistration: true,
      referralSystem: true,
      otpVerification: true,
      gstnValidation: true,
      incidentManagement: true,
    }
  });
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes); // Legacy auth routes
app.use('/api/secure-auth', secureAuthRoutes); // New secure auth routes with referral
app.use('/api/referrals', referralRoutes); // Referral management routes
app.use('/api/company', companyRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/reputation', reputationRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔒 Secure Auth: http://localhost:${PORT}/api/secure-auth`);
  console.log(`🎫 Referrals: http://localhost:${PORT}/api/referrals`);
});

export default app;
