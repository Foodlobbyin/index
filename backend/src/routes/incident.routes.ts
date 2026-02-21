import { Router } from 'express';
import incidentController from '../controllers/incident.controller';
import evidenceController from '../controllers/evidence.controller';
import moderationController from '../controllers/moderation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { apiLimiter, createLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply general rate limiting to all incident routes
router.use(apiLimiter);

// Public routes
router.post('/submit', createLimiter, incidentController.submit.bind(incidentController));
router.get('/search', incidentController.search.bind(incidentController));

// Authenticated user routes - order matters: specific paths before parameterised
router.get('/my-reports', authMiddleware, incidentController.myReports.bind(incidentController));

// Company rep route
router.get('/company/:gstn', authMiddleware, incidentController.getByGstn.bind(incidentController));

// Public incident detail
router.get('/:id', incidentController.getById.bind(incidentController));

// Authenticated user routes for specific incident
router.put('/:id', authMiddleware, incidentController.update.bind(incidentController));
router.delete('/:id', authMiddleware, incidentController.delete.bind(incidentController));

// Evidence routes
router.post(
  '/:id/evidence',
  authMiddleware,
  uploadMiddleware.array('files', parseInt(process.env.MAX_FILES_PER_INCIDENT || '3', 10)),
  evidenceController.upload.bind(evidenceController)
);
router.get('/:id/evidence/:evidenceId', evidenceController.download.bind(evidenceController));

// Company response
router.post('/:id/respond', authMiddleware, moderationController.respondToIncident.bind(moderationController));

export default router;
