import type { Context } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import auditLogService from '../services/auditLog.service';

class AuditLogController {
  searchLogs = async (c: Context<AppBindings>): Promise<Response> => {
    try {
      const db = createDbClient(c.env.DATABASE_URL);
      const parseOptionalInt = (val: unknown): number | undefined => {
        if (val === undefined || val === '') return undefined;
        const n = parseInt(val as string, 10);
        return isNaN(n) ? undefined : n;
      };

      const params = {
        incident_id: parseOptionalInt(c.req.query('incident_id')),
        moderator_id: parseOptionalInt(c.req.query('moderator_id')),
        action: c.req.query('action') as string | undefined,
        date_from: c.req.query('date_from') as string | undefined,
        date_to: c.req.query('date_to') as string | undefined,
        page: parseOptionalInt(c.req.query('page')),
        limit: parseOptionalInt(c.req.query('limit')),
      };
      const result = await auditLogService.searchLogs(db, params);
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  };

  getByIncident = async (c: Context<AppBindings>): Promise<Response> => {
    try {
      const db = createDbClient(c.env.DATABASE_URL);
      const id = parseInt(c.req.param('incidentId')!, 10);
      if (isNaN(id)) {
        return c.json({ error: 'Invalid incidentId' }, 400);
      }
      const result = await auditLogService.getLogsByIncident(db, id);
      return c.json({ logs: result });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  };
}

export default new AuditLogController();
