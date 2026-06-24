import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import incidentController from '../controllers/incident.controller';
import moderationController from '../controllers/moderation.controller';
import evidenceController from '../controllers/evidence.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { apiLimiter, createLimiter } from '../middleware/rateLimiter';
import { requireMinTrustLevel } from '../middleware/trustLevel.middleware';

const router = new Hono<AppBindings>();

// Apply general rate limiting to all incident routes
router.use(apiLimiter);

// Public routes
router.get('/search', incidentController.search);

// Authenticated + verified users only: report an incident (trust_level >= 1)
router.post('/submit', authMiddleware, requireMinTrustLevel('verified'), createLimiter, incidentController.submit);

// Authenticated user routes - order matters: specific paths before parameterised
router.get('/my-reports', authMiddleware, incidentController.myReports);

// Company rep route
router.get('/company/:gstn', authMiddleware, incidentController.getByGstn);

// Public incident detail
router.get('/:id', incidentController.getById);

// Authenticated user routes for specific incident
router.put('/:id', authMiddleware, incidentController.update);
// Admins only: delete any incident (trust_level >= 4)
router.delete('/:id', authMiddleware, requireMinTrustLevel('admin'), incidentController.delete);

// Evidence routes
// POST /:id/evidence — upload evidence files (multipart → R2)
router.post(
  '/:id/evidence',
  authMiddleware,
  requireMinTrustLevel('verified'),
  uploadMiddleware(), // parses multipart, sets c.get('uploadedFiles')
  (c) => evidenceController.upload(c)
);
// GET /:id/evidence/:evidenceId — download evidence file from R2
router.get('/:id/evidence/:evidenceId', authMiddleware, (c) => evidenceController.download(c));

// Company response
router.post('/:id/respond', authMiddleware, moderationController.respondToIncident);

export default router;
