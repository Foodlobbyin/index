import { Router } from 'express';
import reputationController from '../controllers/reputation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(apiLimiter);

/**
 * GET /api/reputation/by-gstn/:gstn
 * Reputation score for a GSTN-registered company.
 * Public (no auth required — data is already approved/public).
 */
router.get('/by-gstn/:gstn', reputationController.getByGstn);

/**
 * GET /api/reputation/by-mobile/:phone
 * Reputation score(s) for company/companies linked to a mobile number.
 * Requires authentication (search must be traceable for rate limiting).
 */
router.get('/by-mobile/:phone', authMiddleware, reputationController.getByMobile);

/**
 * POST /api/reputation/by-gstn/:gstn/recalculate
 * Force-recalculate and persist score. Requires authentication.
 */
router.post(
  '/by-gstn/:gstn/recalculate',
  authMiddleware,
  reputationController.recalculate
);

export default router;
