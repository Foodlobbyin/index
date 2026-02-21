import pool from '../config/database';
import { IncidentEvidence, EvidenceCreateInput } from '../models/IncidentEvidence';

export class IncidentEvidenceRepository {
  async create(data: EvidenceCreateInput): Promise<IncidentEvidence> {
    const { incident_id, file_name, original_name, file_path, file_size, mime_type, uploaded_by } = data;
    const result = await pool.query(
      `INSERT INTO incident_evidence (incident_id, file_name, original_name, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [incident_id, file_name, original_name, file_path, file_size, mime_type, uploaded_by || null]
    );
    return result.rows[0];
  }

  async findByIncidentId(incidentId: number): Promise<IncidentEvidence[]> {
    const result = await pool.query(
      'SELECT * FROM incident_evidence WHERE incident_id = $1 ORDER BY created_at ASC',
      [incidentId]
    );
    return result.rows;
  }

  async findById(id: number): Promise<IncidentEvidence | null> {
    const result = await pool.query('SELECT * FROM incident_evidence WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async countByIncidentId(incidentId: number): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) FROM incident_evidence WHERE incident_id = $1',
      [incidentId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM incident_evidence WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export default new IncidentEvidenceRepository();
