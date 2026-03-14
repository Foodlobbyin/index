import { Router } from 'express';
import moderationController from '../controllers/moderation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimiter';
import { requireMinTrustLevel } from '../middleware/trustLevel.middleware';

const router = Router();

// Apply rate limiting to all moderation routes
router.use(apiLimiter);

// All moderation routes require authentication
router.use(authMiddleware);

router.get('/queue', requireMinTrustLevel('moderator'), moderationController.getQueue.bind(moderationController));
router.put('/incidents/:id/approve', requireMinTrustLevel('moderator'), moderationController.approve.bind(moderationController));
router.put('/incidents/:id/reject', requireMinTrustLevel('moderator'), moderationController.reject.bind(moderationController));
router.post('/incidents/:id/penalty', requireMinTrustLevel('moderator'), moderationController.addPenalty.bind(moderationController));

export default router;
