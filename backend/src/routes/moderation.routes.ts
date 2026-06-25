import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import moderationController from '../controllers/moderation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimiter';
import { requireMinTrustLevel } from '../middleware/trustLevel.middleware';
import { createDbClient } from '../config/database';

const router = new Hono<AppBindings>();
router.use(apiLimiter);
router.use(authMiddleware);

/**
 * GET /api/moderation/queue
 * Returns:
 * - incidents: full incident objects (with incident_invoices + contact_persons) pending review
 * - pending_edits: edit proposals awaiting moderator decision
 */
router.get('/queue', requireMinTrustLevel('moderator'), async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  try {
    // 1. Incidents awaiting review — full detail
    const incResult = await db.query(
      `SELECT * FROM incidents WHERE status IN ('submitted', 'under_review') ORDER BY created_at ASC`
    );

    // For each incident, attach invoices + contacts
    const incidents = await Promise.all(incResult.rows.map(async (inc: any) => {
      const invRes = await db.query(
        'SELECT * FROM incident_invoices WHERE incident_id = $1 ORDER BY id', [inc.id]
      );
      const cpRes = await db.query(
        'SELECT * FROM contact_persons WHERE incident_id = $1 ORDER BY id', [inc.id]
      );
      return { ...inc, incident_invoices: invRes.rows, contact_persons: cpRes.rows };
    }));

    // 2. Pending edits awaiting review
    const editsResult = await db.query(
      `SELECT pe.*,
              i.company_name AS current_company_name,
              i.incident_title AS current_incident_title,
              i.status AS incident_status
       FROM pending_incident_edits pe
       JOIN incidents i ON i.id = pe.incident_id
       WHERE pe.status = 'pending'
       ORDER BY pe.created_at ASC`
    );

    return c.json({ incidents, pending_edits: editsResult.rows });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

router.put('/incidents/:id/review', requireMinTrustLevel('moderator'), moderationController.markUnderReview);
router.put('/incidents/:id/approve', requireMinTrustLevel('moderator'), moderationController.approve);
router.put('/incidents/:id/reject', requireMinTrustLevel('moderator'), moderationController.reject);
router.post('/incidents/:id/penalty', requireMinTrustLevel('moderator'), moderationController.addPenalty);

export default router;
