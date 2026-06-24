import type { Context } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import incidentService from '../services/incident.service';
import auditLogService from '../services/auditLog.service';
import { IncidentCreateInput, IncidentUpdateInput, IncidentSearchParams } from '../models/Incident';

export class IncidentController {
  async submit(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      const body = await c.req.json();
      const data: IncidentCreateInput = {
        ...body,
        reporter_id: user?.id,
      };
      const incident = await incidentService.createIncident(db, data);

      try {
        await auditLogService.writeLog(db, {
          user_id: user?.id,
          action: 'incident_reported',
          entity_type: 'incident',
          entity_id: incident.id,
          details: {
            incident_id: incident.id,
            company_gstn: incident.company_gstn,
            is_anonymous: incident.is_anonymous,
          },
          ip_address:
            c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json({ message: 'Incident submitted successfully', incident }, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  async search(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const userId = c.get('user')?.id;

      if (userId) {
        await incidentService.checkSearchRateLimit(db, userId);
      }

      const page = c.req.query('page');
      const limit = c.req.query('limit');
      const params: IncidentSearchParams = {
        gstn: c.req.query('gstn') as string,
        company_name: c.req.query('company_name') as string,
        incident_type: c.req.query('incident_type') as any,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      };

      const result = await incidentService.searchIncidents(db, params, userId);
      return c.json(result);
    } catch (error: any) {
      if (error.message.includes('Daily search limit')) {
        return c.json({ error: error.message }, 429);
      }
      return c.json({ error: error.message }, 400);
    }
  }

  async myReports(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Authentication required' }, 401);
      }
      const incidents = await incidentService.getMyReports(db, user.id);
      return c.json({ incidents });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }

  async getById(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const id = parseInt(c.req.param('id')!, 10);
      if (isNaN(id)) {
        return c.json({ error: 'Invalid incident ID' }, 400);
      }
      const incident = await incidentService.getIncident(db, id, c.get('user')?.id);
      return c.json({ incident });
    } catch (error: any) {
      if (error.message === 'Incident not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message }, 500);
    }
  }

  async update(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Authentication required' }, 401);
      }
      const id = parseInt(c.req.param('id')!, 10);
      if (isNaN(id)) {
        return c.json({ error: 'Invalid incident ID' }, 400);
      }
      const data: IncidentUpdateInput = await c.req.json();
      const incident = await incidentService.updateIncident(db, id, data, user.id);

      try {
        await auditLogService.writeLog(db, {
          user_id: user.id,
          action: 'incident_updated',
          entity_type: 'incident',
          entity_id: id,
          details: { incident_id: id, changed_fields: Object.keys(data) },
          ip_address:
            c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json({ message: 'Incident updated', incident });
    } catch (error: any) {
      if (error.message === 'Access denied') {
        return c.json({ error: error.message }, 403);
      }
      return c.json({ error: error.message }, 400);
    }
  }

  async delete(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Authentication required' }, 401);
      }
      const id = parseInt(c.req.param('id')!, 10);
      if (isNaN(id)) {
        return c.json({ error: 'Invalid incident ID' }, 400);
      }
      await incidentService.deleteIncident(db, id, user.id);

      try {
        await auditLogService.writeLog(db, {
          user_id: user.id,
          action: 'incident_deleted',
          entity_type: 'incident',
          entity_id: id,
          details: { incident_id: id },
          ip_address:
            c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json({ message: 'Incident deleted' });
    } catch (error: any) {
      if (error.message === 'Access denied') {
        return c.json({ error: error.message }, 403);
      }
      return c.json({ error: error.message }, 400);
    }
  }

  async getByGstn(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const gstn = c.req.param('gstn')!;
      const incidents = await incidentService.getIncidentsByGstn(db, gstn);
      return c.json({ incidents });
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
}

export default new IncidentController();
