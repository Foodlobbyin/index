import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import incidentRepository from '../repositories/incident.repository';

export const validateIncidentOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const incidentId = parseInt(req.params.id, 10);
    if (isNaN(incidentId)) {
      res.status(400).json({ error: 'Invalid incident ID' });
      return;
    }

    const incident = await incidentRepository.findById(incidentId);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    if (incident.reporter_id !== req.user?.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    next();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const requireDraftStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const incidentId = parseInt(req.params.id, 10);
    const incident = await incidentRepository.findById(incidentId);
    if (!incident || incident.status !== 'draft') {
      res.status(400).json({ error: 'Only draft incidents can be modified' });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
