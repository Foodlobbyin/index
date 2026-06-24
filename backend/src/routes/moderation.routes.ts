import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import moderationController from '../controllers/moderation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimiter';
import { requireMinTrustLevel } from '../middleware/trustLevel.middleware';

const router = new Hono<AppBindings>();

// Apply rate limiting to all moderation routes
router.use(apiLimiter);

// All moderation routes require authentication
router.use(authMiddleware);

router.get('/queue', requireMinTrustLevel('moderator'), moderationController.getQueue);
router.put('/incidents/:id/approve', requireMinTrustLevel('moderator'), moderationController.approve);
router.put('/incidents/:id/reject', requireMinTrustLevel('moderator'), moderationController.reject);
router.post('/incidents/:id/penalty', requireMinTrustLevel('moderator'), moderationController.addPenalty);

export default router;
