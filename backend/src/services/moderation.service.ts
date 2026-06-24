import type { DbClient } from '../config/database';
import incidentRepository from '../repositories/incident.repository';
import { incidentResponseRepository, incidentPenaltyRepository } from '../repositories/incidentResponse.repository';
import { Incident } from '../models/Incident';
import { IncidentResponse } from '../models/IncidentResponse';
import { IncidentPenalty, IncidentPenaltyCreateInput } from '../models/IncidentPenalty';
import auditLogService from './auditLog.service';

export class ModerationService {
  async getModerationQueue(db: DbClient): Promise<Incident[]> {
    return incidentRepository.getModerationQueue(db);
  }

  async markUnderReview(db: DbClient, id: number, moderatorId: number): Promise<Incident> {
    const incident = await incidentRepository.findById(db, id);
    if (!incident) throw new Error('Incident not found');
    if (incident.status !== 'submitted') throw new Error('Only submitted incidents can be marked under review');

    const updated = await incidentRepository.updateStatus(db, id, 'under_review', {
      reviewed_by: moderatorId,
    });
    if (!updated) throw new Error('Failed to update incident status');

    await this.logModerationAction(db, id, moderatorId, 'under_review');
    return updated;
  }

  async approveIncident(db: DbClient, id: number, moderatorId: number, notes?: string): Promise<Incident> {
    const incident = await incidentRepository.findById(db, id);
    if (!incident) throw new Error('Incident not found');
    if (!['submitted', 'under_review'].includes(incident.status)) {
      throw new Error('Incident is not in a reviewable state');
    }

    const updated = await incidentRepository.updateStatus(db, id, 'approved', {
      reviewed_by: moderatorId,
      moderator_notes: notes,
    });
    if (!updated) throw new Error('Failed to approve incident');

    await this.logModerationAction(db, id, moderatorId, 'approved', notes);

    try {
      await auditLogService.writeLog(db, {
        user_id: moderatorId,
        action: 'incident_approved',
        entity_type: 'incident',
        entity_id: id,
        details: { incident_id: id, moderator_user_id: moderatorId },
      });
    } catch { /* audit log failure must not break the main action */ }

    return updated;
  }

  async rejectIncident(db: DbClient, id: number, moderatorId: number, reason: string, notes?: string): Promise<Incident> {
    if (!reason?.trim()) throw new Error('Rejection reason is required');

    const incident = await incidentRepository.findById(db, id);
    if (!incident) throw new Error('Incident not found');
    if (!['submitted', 'under_review'].includes(incident.status)) {
      throw new Error('Incident is not in a reviewable state');
    }

    const updated = await incidentRepository.updateStatus(db, id, 'rejected', {
      reviewed_by: moderatorId,
      rejection_reason: reason,
      moderator_notes: notes,
    });
    if (!updated) throw new Error('Failed to reject incident');

    await this.logModerationAction(db, id, moderatorId, 'rejected', reason);

    try {
      await auditLogService.writeLog(db, {
        user_id: moderatorId,
        action: 'incident_rejected',
        entity_type: 'incident',
        entity_id: id,
        details: { incident_id: id, moderator_user_id: moderatorId, reason },
      });
    } catch { /* audit log failure must not break the main action */ }

    return updated;
  }

  async addPenalty(db: DbClient, data: IncidentPenaltyCreateInput): Promise<IncidentPenalty> {
    const incident = await incidentRepository.findById(db, data.incident_id);
    if (!incident) throw new Error('Incident not found');
    if (incident.status !== 'approved') throw new Error('Penalties can only be added to approved incidents');

    if (!data.penalty_amount || data.penalty_amount <= 0) {
      throw new Error('Penalty amount must be positive');
    }
    if (!data.penalty_reason?.trim()) throw new Error('Penalty reason is required');

    const penalty = await incidentPenaltyRepository.create(db, data);
    await this.logModerationAction(db, data.incident_id, data.imposed_by, 'penalty_added', `Amount: ${data.penalty_amount}`);
    return penalty;
  }

  async submitCompanyResponse(
    db: DbClient,
    incidentId: number,
    responderGstn: string,
    responseText: string,
    responderName?: string
  ): Promise<IncidentResponse> {
    const incident = await incidentRepository.findById(db, incidentId);
    if (!incident) throw new Error('Incident not found');
    if (!['approved', 'resolved'].includes(incident.status)) {
      throw new Error('Company responses can only be submitted for approved or resolved incidents');
    }
    if (incident.company_gstn !== responderGstn) {
      throw new Error('You can only respond to incidents about your own company');
    }
    if (!responseText?.trim()) throw new Error('Response text is required');

    return incidentResponseRepository.create(db, {
      incident_id: incidentId,
      responder_gstn: responderGstn,
      responder_name: responderName,
      response_text: responseText,
    });
  }

  private async logModerationAction(
    db: DbClient,
    incidentId: number,
    moderatorId: number,
    action: string,
    notes?: string
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO incident_moderation_log (incident_id, moderator_id, action, notes)
         VALUES ($1, $2, $3, $4)`,
        [incidentId, moderatorId, action, notes || null]
      );
    } catch {
      // Log failure should not break the main operation
      console.error('Failed to log moderation action');
    }
  }
}

export default new ModerationService();
