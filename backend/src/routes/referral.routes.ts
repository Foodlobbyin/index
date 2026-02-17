/**
 * Referral Routes
 * API endpoints for referral code management
 */

import { Router } from 'express';
import referralController from '../controllers/referral.controller';
import { authenticate } from '../middleware/auth.middleware';
import { createRateLimiter, authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Rate limiters
const referralRateLimiter = createRateLimiter(10, 15); // 10 requests per 15 minutes

// Public route for validating referral codes (used during registration)
router.post('/validate', referralRateLimiter, referralController.validateReferral);

// Protected routes (require authentication)
router.post('/', authenticate, referralRateLimiter, referralController.createReferral);
router.get('/my-referrals', authenticate, referralController.getMyReferrals);
router.get('/:code/stats', authenticate, referralController.getReferralStats);
router.patch('/:referralId/deactivate', authenticate, referralController.deactivateReferral);
router.patch('/:referralId/activate', authenticate, referralController.activateReferral);

export default router;
