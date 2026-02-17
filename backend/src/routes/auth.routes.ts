import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// POST /api/auth/register - Rate limited
router.post('/register', authLimiter, (req, res) => authController.register(req, res));

// POST /api/auth/login - Rate limited
router.post('/login', authLimiter, (req, res) => authController.login(req, res));

// GET /api/auth/profile - Protected route
router.get('/profile', authMiddleware, (req, res) => authController.getProfile(req, res));

export default router;
