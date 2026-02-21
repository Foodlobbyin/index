import { Router } from 'express';
import moderationController from '../controllers/moderation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to all moderation routes
router.use(apiLimiter);

// All moderation routes require authentication
router.use(authMiddleware);

router.get('/queue', moderationController.getQueue.bind(moderationController));
router.put('/incidents/:id/approve', moderationController.approve.bind(moderationController));
router.put('/incidents/:id/reject', moderationController.reject.bind(moderationController));
router.post('/incidents/:id/penalty', moderationController.addPenalty.bind(moderationController));

export default router;
