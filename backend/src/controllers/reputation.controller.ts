import type { Context } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import reputationService from '../services/reputation.service';
import auditLogService from '../services/auditLog.service';
import reputationRepository from '../repositories/reputation.repository';

class ReputationController {

  /**
   * GET /api/reputation/by-gstn/:gstn
   * Returns reputation score for a GSTN-registered company.
   */
  getByGstn = async (c: Context<AppBindings>): Promise<Response> => {
    const gstn = c.req.param('gstn');

    if (!gstn || gstn.trim().length < 15) {
      return c.json({
        error: 'Bad Request',
        message: 'A valid 15-character GSTN is required.',
      }, 400);
    }

    try {
      const db = createDbClient(c.env.DATABASE_URL);
      const result = await reputationService.getReputationByGstn(db, gstn.trim().toUpperCase());
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: 'Internal Server Error', message: err.message }, 500);
    }
  };

  /**
   * GET /api/reputation/by-mobile/:phone
   * Resolves a mobile/phone number to one or more companies (GSTN-registered
   * or not) and returns a reputation score for each.
   *
   * Returns an array — one person can be associated with multiple firms.
   * Returns 404 if no company is linked to this number.
   */
  getByMobile = async (c: Context<AppBindings>): Promise<Response> => {
    const phone = c.req.param('phone');

    if (!phone || phone.trim().length < 7) {
      return c.json({
        error: 'Bad Request',
        message: 'A valid phone/mobile number is required.',
      }, 400);
    }

    try {
      const db = createDbClient(c.env.DATABASE_URL);
      const results = await reputationService.getReputationByPhone(db, phone.trim());

      if (results.length === 0) {
        return c.json({
          error: 'Not Found',
          message: 'No company found linked to this phone number.',
        }, 404);
      }

      return c.json({ results });
    } catch (err: any) {
      return c.json({ error: 'Internal Server Error', message: err.message }, 500);
    }
  };

  /**
   * POST /api/reputation/by-gstn/:gstn/recalculate
   * Force-recalculates and persists the reputation score for a GSTN company.
   * Requires authentication.
   */
  recalculate = async (c: Context<AppBindings>): Promise<Response> => {
    const gstn = c.req.param('gstn')!;

    try {
      const db = createDbClient(c.env.DATABASE_URL);
      const oldScore = await reputationRepository.getStoredScoreByGstn(db, gstn);
      const newScore = await reputationService.recalculateAndPersistByGstn(db, gstn);

      try {
        await auditLogService.writeLog(db, {
          action: 'reputation_score_recalculated',
          entity_type: 'company',
          user_id: c.get('user')?.id ?? null,
          details: {
            gstn,
            old_score: oldScore,
            new_score: newScore,
          },
        });
      } catch { /* audit failure must not break main action */ }

      return c.json({ gstn, old_score: oldScore, new_score: newScore });
    } catch (err: any) {
      return c.json({ error: 'Internal Server Error', message: err.message }, 500);
    }
  };
}

export default new ReputationController();
