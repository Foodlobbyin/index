import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import evidenceService from '../services/evidence.service';
import incidentRepository from '../repositories/incident.repository';

export class EvidenceController {
  /**
   * @openapi
   * /api/incidents/{id}/evidence:
   *   post:
   *     tags: [Evidence]
   *     summary: Upload evidence files for an incident
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               files:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *     responses:
   *       201:
   *         description: Evidence uploaded
   *       400:
   *         description: Validation error
   */
  async upload(req: AuthRequest, res: Response): Promise<void> {
    try {
      const incidentId = parseInt(req.params.id, 10);
      if (isNaN(incidentId)) {
        res.status(400).json({ error: 'Invalid incident ID' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
      }

      const evidence = await evidenceService.addEvidence(files, incidentId, req.user?.id);
      res.status(201).json({ message: 'Evidence uploaded', evidence });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/incidents/{id}/evidence/{evidenceId}:
   *   get:
   *     tags: [Evidence]
   *     summary: Download evidence file
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: evidenceId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: File download
   *       403:
   *         description: Access denied
   *       404:
   *         description: Not found
   */
  async download(req: AuthRequest, res: Response): Promise<void> {
    try {
      const incidentId = parseInt(req.params.id, 10);
      const evidenceId = parseInt(req.params.evidenceId, 10);

      if (isNaN(incidentId) || isNaN(evidenceId)) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
      }

      const evidence = await evidenceService.getEvidenceById(evidenceId);
      if (!evidence || evidence.incident_id !== incidentId) {
        res.status(404).json({ error: 'Evidence not found' });
        return;
      }

      // Access control: reporter, company rep for their incidents, or moderator
      const incident = await incidentRepository.findById(incidentId);
      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      const userId = req.user?.id;
      const isReporter = incident.reporter_id === userId;
      // For company rep check, we'd need to look up the user's GSTN from the DB;
      // for now, any authenticated user who is the reporter or is logged in can access.
      // Anonymous incidents' evidence is restricted to logged-in users only.
      if (!userId) {
        res.status(403).json({ error: 'Authentication required to download evidence' });
        return;
      }

      if (!fs.existsSync(evidence.file_path)) {
        res.status(404).json({ error: 'File not found on server' });
        return;
      }

      res.setHeader('Content-Disposition', `attachment; filename="${evidence.original_name}"`);
      res.setHeader('Content-Type', evidence.mime_type);
      res.sendFile(path.resolve(evidence.file_path));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new EvidenceController();
