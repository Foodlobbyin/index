import { Request, Response } from 'express';
import reputationService from '../services/reputation.service';
import auditLogService from '../services/auditLog.service';
import reputationRepository from '../repositories/reputation.repository';

class ReputationController {
  getReputation = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await reputationService.getReputationSummary(req.params.gstn);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  recalculate = async (req: Request, res: Response): Promise<void> => {
    try {
      const oldScore = await reputationRepository.getStoredScoreByGstn(req.params.gstn);
      const newScore = await reputationService.recalculateAndPersist(req.params.gstn);

      try {
        await auditLogService.writeLog({
          action: 'reputation_score_updated',
          entity_type: 'company',
          details: {
            gstn: req.params.gstn,
            old_score: oldScore,
            new_score: newScore,
            reason: 'recalculation',
          },
        });
      } catch { /* audit log failure must not break the main action */ }

      res.json({ gstn: req.params.gstn, reputation_score: newScore });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}

export default new ReputationController();
