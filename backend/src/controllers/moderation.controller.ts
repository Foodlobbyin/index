import type { Context } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import moderationService from '../services/moderation.service';

export class ModerationController {
  async getQueue(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const incidents = await moderationService.getModerationQueue(db);
      return c.json({ incidents });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }

  async approve(c: Context<AppBindings>): Promise<Response> {
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
      const { notes } = await c.req.json();
      const incident = await moderationService.approveIncident(db, id, user.id, notes);
      return c.json({ message: 'Incident approved', incident });
    } catch (error: any) {
      if (error.message === 'Incident not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message }, 400);
    }
  }

  async reject(c: Context<AppBindings>): Promise<Response> {
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
      const { reason, notes } = await c.req.json();
      if (!reason) {
        return c.json({ error: 'Rejection reason is required' }, 400);
      }
      const incident = await moderationService.rejectIncident(db, id, user.id, reason, notes);
      return c.json({ message: 'Incident rejected', incident });
    } catch (error: any) {
      if (error.message === 'Incident not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message }, 400);
    }
  }

  async addPenalty(c: Context<AppBindings>): Promise<Response> {
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
      const { penalty_amount, currency_code, penalty_reason } = await c.req.json();
      const penalty = await moderationService.addPenalty(db, {
        incident_id: id,
        penalty_amount,
        currency_code,
        penalty_reason,
        imposed_by: user.id,
      });
      return c.json({ message: 'Penalty added', penalty }, 201);
    } catch (error: any) {
      if (error.message === 'Incident not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message }, 400);
    }
  }

  async respondToIncident(c: Context<AppBindings>): Promise<Response> {
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
      const { responder_gstn, response_text, responder_name } = await c.req.json();
      if (!responder_gstn || !response_text) {
        return c.json({ error: 'responder_gstn and response_text are required' }, 400);
      }
      const response = await moderationService.submitCompanyResponse(db, id, responder_gstn, response_text, responder_name);
      return c.json({ message: 'Response submitted', response }, 201);
    } catch (error: any) {
      if (error.message === 'Incident not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message }, 400);
    }
  }
}

export default new ModerationController();
