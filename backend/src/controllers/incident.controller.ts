import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import incidentService from '../services/incident.service';
import { IncidentCreateInput, IncidentUpdateInput, IncidentSearchParams } from '../models/Incident';

export class IncidentController {
  /**
   * @openapi
   * /api/incidents/submit:
   *   post:
   *     tags: [Incidents]
   *     summary: Submit a new incident report
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/IncidentCreateInput'
   *     responses:
   *       201:
   *         description: Incident created
   *       400:
   *         description: Validation error
   */
  async submit(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: IncidentCreateInput = {
        ...req.body,
        reporter_id: req.user?.id,
      };
      const incident = await incidentService.createIncident(data);
      res.status(201).json({ message: 'Incident submitted successfully', incident });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/incidents/search:
   *   get:
   *     tags: [Incidents]
   *     summary: Search incidents by company GSTN or name
   *     parameters:
   *       - in: query
   *         name: gstn
   *         schema:
   *           type: string
   *       - in: query
   *         name: company_name
   *         schema:
   *           type: string
   *       - in: query
   *         name: incident_type
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Search results
   *       429:
   *         description: Rate limit exceeded
   */
  async search(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (userId) {
        await incidentService.checkSearchRateLimit(userId);
      }

      const params: IncidentSearchParams = {
        gstn: req.query.gstn as string,
        company_name: req.query.company_name as string,
        incident_type: req.query.incident_type as any,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await incidentService.searchIncidents(params, userId);
      res.json(result);
    } catch (error: any) {
      if (error.message.includes('Daily search limit')) {
        res.status(429).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/incidents/my-reports:
   *   get:
   *     tags: [Incidents]
   *     summary: Get authenticated user's submitted incidents
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of user's incidents
   *       401:
   *         description: Unauthorized
   */
  async myReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const incidents = await incidentService.getMyReports(req.user.id);
      res.json({ incidents });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/incidents/{id}:
   *   get:
   *     tags: [Incidents]
   *     summary: Get incident by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Incident details
   *       404:
   *         description: Not found
   */
  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid incident ID' });
        return;
      }
      const incident = await incidentService.getIncident(id, req.user?.id);
      res.json({ incident });
    } catch (error: any) {
      if (error.message === 'Incident not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/incidents/{id}:
   *   put:
   *     tags: [Incidents]
   *     summary: Update a draft incident
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
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/IncidentUpdateInput'
   *     responses:
   *       200:
   *         description: Updated incident
   *       400:
   *         description: Validation error or not a draft
   *       403:
   *         description: Access denied
   */
  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid incident ID' });
        return;
      }
      const data: IncidentUpdateInput = req.body;
      const incident = await incidentService.updateIncident(id, data, req.user.id);
      res.json({ message: 'Incident updated', incident });
    } catch (error: any) {
      if (error.message === 'Access denied') {
        res.status(403).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/incidents/{id}:
   *   delete:
   *     tags: [Incidents]
   *     summary: Delete a draft incident
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Deleted
   *       400:
   *         description: Not a draft
   *       403:
   *         description: Access denied
   */
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid incident ID' });
        return;
      }
      await incidentService.deleteIncident(id, req.user.id);
      res.json({ message: 'Incident deleted' });
    } catch (error: any) {
      if (error.message === 'Access denied') {
        res.status(403).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/incidents/company/{gstn}:
   *   get:
   *     tags: [Incidents]
   *     summary: Get incidents for a specific company by GSTN
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: gstn
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of incidents
   */
  async getByGstn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { gstn } = req.params;
      const incidents = await incidentService.getIncidentsByGstn(gstn);
      res.json({ incidents });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new IncidentController();
