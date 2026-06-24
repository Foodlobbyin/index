import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import incidentController from '../controllers/incident.controller';
import moderationController from '../controllers/moderation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
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
// TODO(evidence-upload): multipart upload is deferred — upload.middleware & evidence.controller
// depend on multer/Express and will be re-implemented for Workers (R2) in a later phase.
router.post('/:id/evidence', (c) => c.json({ error: 'Not Implemented', message: 'Evidence upload is not yet available on the Workers runtime.' }, 501));
router.get('/:id/evidence/:evidenceId', (c) => c.json({ error: 'Not Implemented', message: 'Evidence upload is not yet available on the Workers runtime.' }, 501));

// Company response
router.post('/:id/respond', authMiddleware, moderationController.respondToIncident);

export default router;
