import { Router } from 'express';
import reputationController from '../controllers/reputation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(apiLimiter);

router.get('/:gstn', reputationController.getReputation);
router.post('/:gstn/recalculate', authMiddleware, reputationController.recalculate);

export default router;
