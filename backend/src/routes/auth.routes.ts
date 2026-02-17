import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// POST /api/auth/register - Rate limited
router.post('/register', authLimiter, (req, res) => authController.register(req, res));

// POST /api/auth/login - Rate limited
router.post('/login', authLimiter, (req, res) => authController.login(req, res));

// GET /api/auth/verify-email - Verify email with token
router.get('/verify-email', (req, res) => authController.verifyEmail(req, res));

// POST /api/auth/request-password-reset - Request password reset
router.post('/request-password-reset', authLimiter, (req, res) => authController.requestPasswordReset(req, res));

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', authLimiter, (req, res) => authController.resetPassword(req, res));

// POST /api/auth/request-email-otp - Request OTP for email login
router.post('/request-email-otp', authLimiter, (req, res) => authController.requestEmailOTP(req, res));

// POST /api/auth/login-with-otp - Login with email OTP
router.post('/login-with-otp', authLimiter, (req, res) => authController.loginWithEmailOTP(req, res));

// GET /api/auth/profile - Protected route
router.get('/profile', authMiddleware, (req, res) => authController.getProfile(req, res));

export default router;
