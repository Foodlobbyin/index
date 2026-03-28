import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { TrustLevel, TRUST_LEVEL_RANK } from '../middleware/trustLevel.middleware';
import pool from '../config/database';
import auditLogService from '../services/auditLog.service';

const VALID_TRUST_LEVELS: TrustLevel[] = ['new', 'verified', 'trusted', 'moderator', 'admin'];

class AdminController {
  /**
   * PUT /api/admin/users/:id/trust-level
   * Admin-only: promote or demote a user's trust level.
   */
  async updateTrustLevel(req: AuthRequest, res: Response): Promise<void> {
    const userId = parseInt(req.params.id, 10);
    const { trust_level } = req.body as { trust_level?: string };
    const actorId = req.user?.id;

    if (isNaN(userId)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid user id.' });
      return;
    }

    if (!trust_level || !VALID_TRUST_LEVELS.includes(trust_level as TrustLevel)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `trust_level must be one of: ${VALID_TRUST_LEVELS.join(', ')}`,
      });
      return;
    }

    // An admin cannot demote themselves to avoid being locked out
    if (actorId === userId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Admins cannot change their own trust level.',
      });
      return;
    }

    // Fetch the user to confirm existence
    const userResult = await pool.query(
      'SELECT id, username, email, trust_level FROM users WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'User not found.' });
      return;
    }

    const targetUser = userResult.rows[0];
    const previousLevel: string = targetUser.trust_level ?? 'new';

    // Apply the update
    await pool.query('UPDATE users SET trust_level = $1 WHERE id = $2', [
      trust_level,
      userId,
    ]);

    // Log the action in audit_logs
    try {
      await auditLogService.writeLog({
        action: 'TRUST_LEVEL_CHANGED',
        entity_type: 'user',
        entity_id: userId,
        user_id: actorId ?? null,
        details: {
          previous_trust_level: previousLevel,
          new_trust_level: trust_level,
          target_username: targetUser.username,
        },
      });
    } catch (_err) {
      // Audit log failure must not block the response
    }

    res.status(200).json({
      message: 'Trust level updated successfully.',
      user_id: userId,
      username: targetUser.username,
      previous_trust_level: previousLevel,
      new_trust_level: trust_level,
    });
  }

  /**
   * GET /api/admin/users/promotion-candidates
   * Admin/Moderator: list users eligible for trust-level promotion
   * (users with 3+ approved incidents whose trust_level is still 'new' or 'verified').
   */
  async getPromotionCandidates(req: AuthRequest, res: Response): Promise<void> {
    const result = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.trust_level,
         COUNT(i.id)::int AS approved_incident_count
       FROM users u
       JOIN incidents i
         ON i.reporter_id = u.id
        AND i.status IN ('approved', 'resolved')
       WHERE u.trust_level IN ('new', 'verified')
       GROUP BY u.id, u.username, u.email, u.trust_level
       HAVING COUNT(i.id) >= 3
       ORDER BY approved_incident_count DESC`
    );

    res.status(200).json({ candidates: result.rows });
  }
}

export default new AdminController();
