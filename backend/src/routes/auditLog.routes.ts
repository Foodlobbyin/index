import { Router } from 'express';
import auditLogController from '../controllers/auditLog.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimiter';
import { requireTrustLevel } from '../middleware/trustLevel.middleware';

const router = Router();

// All audit log routes require authentication (admin/moderator only)
router.use(apiLimiter);
router.use(authMiddleware);

// GET /api/audit-logs?incident_id=&moderator_id=&action=&date_from=&date_to=&page=&limit=
router.get('/', requireTrustLevel('moderator', 'admin'), auditLogController.searchLogs);

// GET /api/audit-logs/incident/:incidentId
router.get('/incident/:incidentId', requireTrustLevel('moderator', 'admin'), auditLogController.getByIncident);

export default router;
