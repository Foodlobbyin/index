import pool from '../config/database';
import { IncidentResponse, IncidentResponseCreateInput } from '../models/IncidentResponse';
import { IncidentPenalty, IncidentPenaltyCreateInput } from '../models/IncidentPenalty';

export class IncidentResponseRepository {
  async create(data: IncidentResponseCreateInput): Promise<IncidentResponse> {
    const { incident_id, responder_gstn, responder_name, response_text } = data;
    const result = await pool.query(
      `INSERT INTO incident_responses (incident_id, responder_gstn, responder_name, response_text)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [incident_id, responder_gstn, responder_name || null, response_text]
    );
    return result.rows[0];
  }

  async findByIncidentId(incidentId: number): Promise<IncidentResponse[]> {
    const result = await pool.query(
      'SELECT * FROM incident_responses WHERE incident_id = $1 ORDER BY created_at ASC',
      [incidentId]
    );
    return result.rows;
  }
}

export class IncidentPenaltyRepository {
  async create(data: IncidentPenaltyCreateInput): Promise<IncidentPenalty> {
    const { incident_id, penalty_amount, currency_code = 'INR', penalty_reason, imposed_by } = data;
    const result = await pool.query(
      `INSERT INTO incident_penalties (incident_id, penalty_amount, currency_code, penalty_reason, imposed_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [incident_id, penalty_amount, currency_code, penalty_reason, imposed_by]
    );
    return result.rows[0];
  }

  async findByIncidentId(incidentId: number): Promise<IncidentPenalty[]> {
    const result = await pool.query(
      'SELECT * FROM incident_penalties WHERE incident_id = $1 ORDER BY created_at ASC',
      [incidentId]
    );
    return result.rows;
  }
}

export const incidentResponseRepository = new IncidentResponseRepository();
export const incidentPenaltyRepository = new IncidentPenaltyRepository();
