import type { DbClient } from '../config/database';
import { IncidentEvidence, EvidenceCreateInput } from '../models/IncidentEvidence';

export class IncidentEvidenceRepository {
  async create(db: DbClient, data: EvidenceCreateInput): Promise<IncidentEvidence> {
    const { incident_id, file_name, original_name, file_path, file_size, mime_type, uploaded_by } = data;
    const result = await db.query(
      `INSERT INTO incident_evidence (incident_id, file_name, original_name, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [incident_id, file_name, original_name, file_path, file_size, mime_type, uploaded_by || null]
    );
    return result.rows[0];
  }

  async findByIncidentId(db: DbClient, incidentId: number): Promise<IncidentEvidence[]> {
    const result = await db.query(
      'SELECT * FROM incident_evidence WHERE incident_id = $1 ORDER BY created_at ASC',
      [incidentId]
    );
    return result.rows;
  }

  async findById(db: DbClient, id: number): Promise<IncidentEvidence | null> {
    const result = await db.query('SELECT * FROM incident_evidence WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async countByIncidentId(db: DbClient, incidentId: number): Promise<number> {
    const result = await db.query(
      'SELECT COUNT(*) FROM incident_evidence WHERE incident_id = $1',
      [incidentId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async delete(db: DbClient, id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM incident_evidence WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }
}

export default new IncidentEvidenceRepository();
