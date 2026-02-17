import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => authController.register(req, res));

// POST /api/auth/login
router.post('/login', (req, res) => authController.login(req, res));

// GET /api/auth/profile - Protected route
router.get('/profile', authMiddleware, (req, res) => authController.getProfile(req, res));

export default router;
