import pool from '../config/database';
import {
  Incident,
  IncidentCreateInput,
  IncidentUpdateInput,
  IncidentSearchParams,
  IncidentStatus,
} from '../models/Incident';

export class IncidentRepository {
  async create(data: IncidentCreateInput): Promise<Incident> {
    const {
      company_gstn,
      company_name,
      incident_type,
      incident_date,
      incident_title,
      description,
      amount_involved,
      currency_code = 'INR',
      is_anonymous = false,
      reporter_id,
      reporter_name,
      reporter_email,
      reporter_phone,
    } = data;

    const result = await pool.query(
      `INSERT INTO incidents (
        company_gstn, company_name, incident_type, incident_date, incident_title,
        description, amount_involved, currency_code, status, is_anonymous,
        reporter_id, reporter_name, reporter_email, reporter_phone
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'draft',$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        company_gstn,
        company_name,
        incident_type,
        incident_date,
        incident_title,
        description,
        amount_involved || null,
        currency_code,
        is_anonymous,
        reporter_id || null,
        reporter_name || null,
        reporter_email || null,
        reporter_phone || null,
      ]
    );
    return result.rows[0];
  }

  async findById(id: number): Promise<Incident | null> {
    const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByReporterId(reporterId: number): Promise<Incident[]> {
    const result = await pool.query(
      'SELECT * FROM incidents WHERE reporter_id = $1 ORDER BY created_at DESC',
      [reporterId]
    );
    return result.rows;
  }

  async findByGstn(gstn: string): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM incidents WHERE company_gstn = $1 AND status IN ('approved', 'resolved') ORDER BY created_at DESC`,
      [gstn]
    );
    return result.rows;
  }

  async search(params: IncidentSearchParams): Promise<{ incidents: Incident[]; total: number }> {
    const { gstn, company_name, status, incident_type, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = ["status IN ('approved', 'resolved')"];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (gstn) {
      conditions.push(`company_gstn = $${paramIndex++}`);
      values.push(gstn);
    }
    if (company_name) {
      conditions.push(`company_name ILIKE $${paramIndex++}`);
      values.push(`%${company_name}%`);
    }
    if (status) {
      conditions[0] = `status = $${paramIndex++}`;
      values.push(status);
    }
    if (incident_type) {
      conditions.push(`incident_type = $${paramIndex++}`);
      values.push(incident_type);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM incidents ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `SELECT * FROM incidents ${where} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset]
    );

    return { incidents: dataResult.rows, total };
  }

  async update(id: number, data: IncidentUpdateInput): Promise<Incident | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const allowedFields: (keyof IncidentUpdateInput)[] = [
      'company_gstn',
      'company_name',
      'incident_type',
      'incident_date',
      'incident_title',
      'description',
      'amount_involved',
      'currency_code',
      'reporter_name',
      'reporter_email',
      'reporter_phone',
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE incidents SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async updateStatus(
    id: number,
    status: IncidentStatus,
    extra?: {
      moderator_notes?: string;
      reviewed_by?: number;
      rejection_reason?: string;
    }
  ): Promise<Incident | null> {
    const fields = ['status = $1', 'updated_at = NOW()'];
    const values: unknown[] = [status];
    let idx = 2;

    if (extra?.moderator_notes !== undefined) {
      fields.push(`moderator_notes = $${idx++}`);
      values.push(extra.moderator_notes);
    }
    if (extra?.reviewed_by !== undefined) {
      fields.push(`reviewed_by = $${idx++}`);
      values.push(extra.reviewed_by);
      fields.push(`reviewed_at = NOW()`);
    }
    if (extra?.rejection_reason !== undefined) {
      fields.push(`rejection_reason = $${idx++}`);
      values.push(extra.rejection_reason);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE incidents SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM incidents WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getModerationQueue(): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM incidents WHERE status IN ('submitted', 'under_review') ORDER BY created_at ASC`
    );
    return result.rows;
  }
}

export default new IncidentRepository();
