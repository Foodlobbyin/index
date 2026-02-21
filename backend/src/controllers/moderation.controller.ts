import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import moderationService from '../services/moderation.service';

export class ModerationController {
  /**
   * @openapi
   * /api/moderation/queue:
   *   get:
   *     tags: [Moderation]
   *     summary: Get incidents pending moderation
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Moderation queue
   *       401:
   *         description: Unauthorized
   */
  async getQueue(req: AuthRequest, res: Response): Promise<void> {
    try {
      const incidents = await moderationService.getModerationQueue();
      res.json({ incidents });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/moderation/incidents/{id}/approve:
   *   put:
   *     tags: [Moderation]
   *     summary: Approve an incident
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Incident approved
   *       400:
   *         description: Invalid state
   *       404:
   *         description: Not found
   */
  async approve(req: AuthRequest, res: Response): Promise<void> {
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
      const { notes } = req.body;
      const incident = await moderationService.approveIncident(id, req.user.id, notes);
      res.json({ message: 'Incident approved', incident });
    } catch (error: any) {
      if (error.message === 'Incident not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/moderation/incidents/{id}/reject:
   *   put:
   *     tags: [Moderation]
   *     summary: Reject an incident with reason
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
   *             type: object
   *             required:
   *               - reason
   *             properties:
   *               reason:
   *                 type: string
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Incident rejected
   *       400:
   *         description: Validation error
   *       404:
   *         description: Not found
   */
  async reject(req: AuthRequest, res: Response): Promise<void> {
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
      const { reason, notes } = req.body;
      if (!reason) {
        res.status(400).json({ error: 'Rejection reason is required' });
        return;
      }
      const incident = await moderationService.rejectIncident(id, req.user.id, reason, notes);
      res.json({ message: 'Incident rejected', incident });
    } catch (error: any) {
      if (error.message === 'Incident not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/moderation/incidents/{id}/penalty:
   *   post:
   *     tags: [Moderation]
   *     summary: Add penalty to an incident
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
   *             type: object
   *             required:
   *               - penalty_amount
   *               - penalty_reason
   *             properties:
   *               penalty_amount:
   *                 type: number
   *               currency_code:
   *                 type: string
   *               penalty_reason:
   *                 type: string
   *     responses:
   *       201:
   *         description: Penalty added
   *       400:
   *         description: Validation error
   *       404:
   *         description: Not found
   */
  async addPenalty(req: AuthRequest, res: Response): Promise<void> {
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
      const { penalty_amount, currency_code, penalty_reason } = req.body;
      const penalty = await moderationService.addPenalty({
        incident_id: id,
        penalty_amount,
        currency_code,
        penalty_reason,
        imposed_by: req.user.id,
      });
      res.status(201).json({ message: 'Penalty added', penalty });
    } catch (error: any) {
      if (error.message === 'Incident not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * @openapi
   * /api/incidents/{id}/respond:
   *   post:
   *     tags: [Incidents]
   *     summary: Submit company response to an incident
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
   *             type: object
   *             required:
   *               - responder_gstn
   *               - response_text
   *             properties:
   *               responder_gstn:
   *                 type: string
   *               responder_name:
   *                 type: string
   *               response_text:
   *                 type: string
   *     responses:
   *       201:
   *         description: Response submitted
   *       400:
   *         description: Validation error
   */
  async respondToIncident(req: AuthRequest, res: Response): Promise<void> {
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
      const { responder_gstn, response_text, responder_name } = req.body;
      if (!responder_gstn || !response_text) {
        res.status(400).json({ error: 'responder_gstn and response_text are required' });
        return;
      }
      const response = await moderationService.submitCompanyResponse(id, responder_gstn, response_text, responder_name);
      res.status(201).json({ message: 'Response submitted', response });
    } catch (error: any) {
      if (error.message === 'Incident not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
    }
  }
}

export default new ModerationController();
