import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import adminController from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireTrustLevel } from '../middleware/trustLevel.middleware';
import { apiLimiter } from '../middleware/rateLimiter';

const router = new Hono<AppBindings>();

// Rate limiting + authentication on all admin routes
router.use(apiLimiter);
router.use(authMiddleware);

/**
 * PUT /api/admin/users/:id/trust-level
 * Promote or demote a user's trust level.
 * Only admins may call this.
 */
router.put(
  '/users/:id/trust-level',
  requireTrustLevel('admin'),
  adminController.updateTrustLevel
);

/**
 * GET /api/admin/users/promotion-candidates
 * List users with 3+ approved incidents who are still at new/verified level.
 * Admins and moderators may view this list.
 */
router.get(
  '/users/promotion-candidates',
  requireTrustLevel('moderator', 'admin'),
  adminController.getPromotionCandidates
);

export default router;
