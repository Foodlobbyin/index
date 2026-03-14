import { Request, Response } from 'express';
import reputationService from '../services/reputation.service';

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
      const newScore = await reputationService.recalculateAndPersist(req.params.gstn);
      res.json({ gstn: req.params.gstn, reputation_score: newScore });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}

export default new ReputationController();
