import { Router } from 'express';
import companyController from '../controllers/company.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/company - Create company profile (rate limited)
router.post('/', createLimiter, (req, res) => companyController.createCompany(req, res));

// GET /api/company - Get user's company profile
router.get('/', (req, res) => companyController.getCompany(req, res));

// PUT /api/company/:id - Update company profile
router.put('/:id', (req, res) => companyController.updateCompany(req, res));

// DELETE /api/company/:id - Delete company profile
router.delete('/:id', (req, res) => companyController.deleteCompany(req, res));

export default router;
