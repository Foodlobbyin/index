import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import reputationService from '../services/reputation.service';
import auditLogService from '../services/auditLog.service';
import reputationRepository from '../repositories/reputation.repository';

class ReputationController {

  /**
   * GET /api/reputation/by-gstn/:gstn
   * Returns reputation score for a GSTN-registered company.
   */
  getByGstn = async (req: Request, res: Response): Promise<void> => {
    const { gstn } = req.params;

    if (!gstn || gstn.trim().length < 15) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'A valid 15-character GSTN is required.',
      });
      return;
    }

    try {
      const result = await reputationService.getReputationByGstn(gstn.trim().toUpperCase());
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
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
  getByMobile = async (req: Request, res: Response): Promise<void> => {
    const { phone } = req.params;

    if (!phone || phone.trim().length < 7) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'A valid phone/mobile number is required.',
      });
      return;
    }

    try {
      const results = await reputationService.getReputationByPhone(phone.trim());

      if (results.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: 'No company found linked to this phone number.',
        });
        return;
      }

      res.json({ results });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  };

  /**
   * POST /api/reputation/by-gstn/:gstn/recalculate
   * Force-recalculates and persists the reputation score for a GSTN company.
   * Requires authentication.
   */
  recalculate = async (req: AuthRequest, res: Response): Promise<void> => {
    const { gstn } = req.params;

    try {
      const oldScore = await reputationRepository.getStoredScoreByGstn(gstn);
      const newScore = await reputationService.recalculateAndPersistByGstn(gstn);

      try {
        await auditLogService.writeLog({
          action: 'reputation_score_recalculated',
          entity_type: 'company',
          user_id: req.user?.id ?? null,
          details: {
            gstn,
            old_score: oldScore,
            new_score: newScore,
          },
        });
      } catch { /* audit failure must not break main action */ }

      res.json({ gstn, old_score: oldScore, new_score: newScore });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  };
}

export default new ReputationController();
