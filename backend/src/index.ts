import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import secureAuthRoutes from './routes/secure-auth.routes';
import referralRoutes from './routes/referral.routes';
import companyRoutes from './routes/company.routes';
import invoiceRoutes from './routes/invoice.routes';
import insightsRoutes from './routes/insights.routes';
import { apiLimiter } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check
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
    }
  });
});

// Routes
app.use('/api/auth', authRoutes); // Legacy auth routes
app.use('/api/secure-auth', secureAuthRoutes); // New secure auth routes with referral
app.use('/api/referrals', referralRoutes); // Referral management routes
app.use('/api/company', companyRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/insights', insightsRoutes);

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
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔒 Secure Auth: http://localhost:${PORT}/api/secure-auth`);
  console.log(`🎫 Referrals: http://localhost:${PORT}/api/referrals`);
});

export default app;
