import { Router } from 'express';
import auditLogController from '../controllers/auditLog.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

// All audit log routes require authentication (admin/moderator only)
router.use(apiLimiter);
router.use(authMiddleware);

// GET /api/audit-logs?incident_id=&moderator_id=&action=&date_from=&date_to=&page=&limit=
router.get('/', auditLogController.searchLogs);

// GET /api/audit-logs/incident/:incidentId
router.get('/incident/:incidentId', auditLogController.getByIncident);

export default router;
