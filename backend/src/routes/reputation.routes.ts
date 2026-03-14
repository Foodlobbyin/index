import { Router } from 'express';
import reputationController from '../controllers/reputation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/:gstn', reputationController.getReputation);
router.post('/:gstn/recalculate', authMiddleware, reputationController.recalculate);

export default router;
