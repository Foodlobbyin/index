import incidentRepository from '../repositories/incident.repository';
import { Incident, IncidentCreateInput, IncidentUpdateInput, IncidentSearchParams } from '../models/Incident';
import gstnService from './gstn.service';
import pool from '../config/database';

export class IncidentService {
  async createIncident(data: IncidentCreateInput): Promise<Incident> {
    gstnService.assertValid(data.company_gstn);

    if (!data.company_name?.trim()) throw new Error('Company name is required');
    if (!data.incident_title?.trim()) throw new Error('Incident title is required');
    if (!data.description?.trim()) throw new Error('Description is required');
    if (!data.incident_date) throw new Error('Incident date is required');

    const validTypes = ['FRAUD', 'QUALITY_ISSUE', 'SERVICE_ISSUE', 'PAYMENT_ISSUE', 'CONTRACT_BREACH', 'OTHER'];
    if (!validTypes.includes(data.incident_type)) {
      throw new Error(`Invalid incident type. Must be one of: ${validTypes.join(', ')}`);
    }

    return incidentRepository.create(data);
  }

  async submitIncident(id: number, reporterId?: number): Promise<Incident> {
    const incident = await incidentRepository.findById(id);
    if (!incident) throw new Error('Incident not found');
    if (incident.status !== 'draft') throw new Error('Only draft incidents can be submitted');
    if (reporterId !== undefined && incident.reporter_id !== reporterId) {
      throw new Error('Access denied');
    }

    const updated = await incidentRepository.updateStatus(id, 'submitted');
    if (!updated) throw new Error('Failed to submit incident');
    return updated;
  }

  async getIncident(id: number, requesterId?: number, isModerator = false): Promise<Incident> {
    const incident = await incidentRepository.findById(id);
    if (!incident) throw new Error('Incident not found');

    // Hide reporter details for anonymous incidents unless requester is the reporter or a moderator
    if (incident.is_anonymous && !isModerator && incident.reporter_id !== requesterId) {
      return {
        ...incident,
        reporter_id: undefined,
        reporter_name: undefined,
        reporter_email: undefined,
        reporter_phone: undefined,
      } as Incident;
    }

    return incident;
  }

  async getMyReports(reporterId: number): Promise<Incident[]> {
    return incidentRepository.findByReporterId(reporterId);
  }

  async searchIncidents(params: IncidentSearchParams, userId?: number): Promise<{ incidents: Incident[]; total: number }> {
    // Track search count for rate limiting
    if (userId) {
      await this.trackSearchCount(userId);
    }
    return incidentRepository.search(params);
  }

  private async trackSearchCount(userId: number): Promise<void> {
    // Reset daily count if last reset was not today (in IST)
    await pool.query(
      `UPDATE users SET
        daily_search_count = CASE
          WHEN last_search_reset_date IS NULL OR last_search_reset_date < CURRENT_DATE AT TIME ZONE 'Asia/Kolkata'
          THEN 1
          ELSE daily_search_count + 1
        END,
        last_search_reset_date = CURRENT_DATE AT TIME ZONE 'Asia/Kolkata'
      WHERE id = $1`,
      [userId]
    );
  }

  async checkSearchRateLimit(userId: number): Promise<void> {
    const limit = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
    const result = await pool.query(
      `SELECT daily_search_count, last_search_reset_date FROM users WHERE id = $1`,
      [userId]
    );
    if (!result.rows[0]) return;
    const { daily_search_count, last_search_reset_date } = result.rows[0];

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const resetDate = last_search_reset_date
      ? new Date(last_search_reset_date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
      : null;

    if (resetDate === today && daily_search_count >= limit) {
      throw new Error('Daily search limit reached. Please try again tomorrow.');
    }
  }

  async updateIncident(id: number, data: IncidentUpdateInput, reporterId: number): Promise<Incident> {
    const incident = await incidentRepository.findById(id);
    if (!incident) throw new Error('Incident not found');
    if (incident.reporter_id !== reporterId) throw new Error('Access denied');
    if (incident.status !== 'draft') throw new Error('Only draft incidents can be updated');

    if (data.company_gstn) gstnService.assertValid(data.company_gstn);

    const updated = await incidentRepository.update(id, data);
    if (!updated) throw new Error('Failed to update incident');
    return updated;
  }

  async deleteIncident(id: number, reporterId: number): Promise<void> {
    const incident = await incidentRepository.findById(id);
    if (!incident) throw new Error('Incident not found');
    if (incident.reporter_id !== reporterId) throw new Error('Access denied');
    if (incident.status !== 'draft') throw new Error('Only draft incidents can be deleted');

    await incidentRepository.delete(id);
  }

  async getIncidentsByGstn(gstn: string): Promise<Incident[]> {
    gstnService.assertValid(gstn);
    return incidentRepository.findByGstn(gstn);
  }
}

export default new IncidentService();
