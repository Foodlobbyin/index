import { Request, Response } from 'express';
import auditLogService from '../services/auditLog.service';

class AuditLogController {
  searchLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const parseOptionalInt = (val: unknown): number | undefined => {
        if (val === undefined || val === '') return undefined;
        const n = parseInt(val as string, 10);
        return isNaN(n) ? undefined : n;
      };

      const params = {
        incident_id: parseOptionalInt(req.query.incident_id),
        moderator_id: parseOptionalInt(req.query.moderator_id),
        action: req.query.action as string | undefined,
        date_from: req.query.date_from as string | undefined,
        date_to: req.query.date_to as string | undefined,
        page: parseOptionalInt(req.query.page),
        limit: parseOptionalInt(req.query.limit),
      };
      const result = await auditLogService.searchLogs(params);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  getByIncident = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.incidentId, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid incidentId' });
        return;
      }
      const result = await auditLogService.getLogsByIncident(id);
      res.json({ logs: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}

export default new AuditLogController();
