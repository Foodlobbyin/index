import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /register
router.post('/register', AuthController.register);

// POST /login
router.post('/login', AuthController.login);

// GET /profile
router.get('/profile', authMiddleware, AuthController.getProfile);

export default router;