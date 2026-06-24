import type { MiddlewareHandler } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import incidentRepository from '../repositories/incident.repository';

export const validateIncidentOwnership: MiddlewareHandler<AppBindings> = async (c, next) => {
  try {
    const incidentId = parseInt(c.req.param('id') ?? '', 10);
    if (isNaN(incidentId)) {
      return c.json({ error: 'Invalid incident ID' }, 400);
    }

    const db = createDbClient(c.env.DATABASE_URL);
    const incident = await incidentRepository.findById(db, incidentId);
    if (!incident) {
      return c.json({ error: 'Incident not found' }, 404);
    }

    const user = c.get('user');
    if (incident.reporter_id !== user?.id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    await next();
  } catch {
    return c.json({ error: 'Internal server error' }, 500);
  }
};

export const requireDraftStatus: MiddlewareHandler<AppBindings> = async (c, next) => {
  try {
    const incidentId = parseInt(c.req.param('id') ?? '', 10);
    const db = createDbClient(c.env.DATABASE_URL);
    const incident = await incidentRepository.findById(db, incidentId);
    if (!incident || incident.status !== 'draft') {
      return c.json({ error: 'Only draft incidents can be modified' }, 400);
    }
    await next();
  } catch {
    return c.json({ error: 'Internal server error' }, 500);
  }
};
