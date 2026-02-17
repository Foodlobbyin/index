/**
 * Secure Auth Routes
 * API endpoints for secure authentication with referral-based registration
 */

import { Router } from 'express';
import secureAuthController from '../controllers/secure-auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter, otpRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes with rate limiting
router.post('/register', authRateLimiter, secureAuthController.register);
router.post('/verify-otp', otpRateLimiter, secureAuthController.verifyOTP);
router.post('/request-otp', otpRateLimiter, secureAuthController.requestOTP);
router.post('/login', authRateLimiter, secureAuthController.login);

// Protected routes
router.get('/profile', authenticate, secureAuthController.getProfile);

export default router;
