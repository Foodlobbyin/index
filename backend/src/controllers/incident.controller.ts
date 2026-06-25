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

  async submitForReview(c: Context<AppBindings>): Promise<Response> {
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
      const incident = await incidentService.submitIncident(db, id, user.id);

      try {
        await auditLogService.writeLog(db, {
          user_id: user.id,
          action: 'incident_submitted_for_review',
          entity_type: 'incident',
          entity_id: id,
          details: { incident_id: id, status: incident.status },
          ip_address:
            c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json({ message: 'Incident submitted for review', incident });
    } catch (error: any) {
      if (error.message === 'Access denied') {
        return c.json({ error: error.message }, 403);
      }
      if (error.message === 'Incident not found') {
        return c.json({ error: error.message }, 404);
      }
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

  /**
   * GET /incidents/against-my-company
   * Returns the count of approved/resolved incidents filed against
   * the authenticated user's registered company.
   * Used by the frontend to decide whether to show "My Defaults" in the nav.
   */
  async againstMyCompany(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      // Look up the user's registered company GSTN
      const companyResult = await db.query(
        `SELECT gstn FROM company_profiles WHERE user_id = $1 LIMIT 1`,
        [user.id]
      );

      if (!companyResult.rows[0]?.gstn) {
        // User has no registered company — they cannot have incidents filed against them
        return c.json({ count: 0 });
      }

      const gstn = companyResult.rows[0].gstn.trim().toUpperCase();

      // Count incidents where the reported company GSTN matches and status is meaningful
      const result = await db.query(
        `SELECT COUNT(*)::int AS count
           FROM incidents
          WHERE UPPER(TRIM(company_gstn)) = $1
            AND status IN ('submitted', 'under_review', 'approved', 'resolved')`,
        [gstn]
      );

      const count = result.rows[0]?.count ?? 0;
      return c.json({ count });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }
}

export default new IncidentController();
