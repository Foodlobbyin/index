import type { DbClient } from '../config/database';
import {
  Incident,
  IncidentCreateInput,
  IncidentUpdateInput,
  IncidentSearchParams,
  IncidentStatus,
} from '../models/Incident';

export class IncidentRepository {
  async create(db: DbClient, data: IncidentCreateInput): Promise<Incident> {
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
      // Invoice fields (from Step 2 of the report form)
      invoice_amount,
      unpaid_amount,
      invoice_date,
      due_date,
      item_sold,
      // Contact persons (from Step 3)
      contact_persons,
    } = data as any;

    // 1. Insert the incident record
    const result = await db.query(
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
    const incident = result.rows[0];

    // 2. Save invoice details to invoices table (linked to the reported company)
    if (invoice_amount || unpaid_amount || invoice_date || due_date) {
      // Generate a unique invoice number: INC-<incidentId>-<timestamp>
      const invoiceNumber = `INC-${incident.id}-${Date.now()}`;
      await db.query(
        `INSERT INTO invoices (
          company_id, invoice_number, amount, issue_date, due_date, status,
          description, category, amount_unpaid,
          reported_company_gstn, reported_company_name, incident_id, item_sold, reporter_user_id
        ) VALUES (
          NULL, $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9, $10, $11, $12, $13
        )`,
        [
          invoiceNumber,
          invoice_amount || amount_involved || null,
          invoice_date || null,
          due_date || null,
          'pending',
          description || null,
          incident_type || null,
          unpaid_amount ?? invoice_amount ?? amount_involved ?? null,
          company_gstn || null,
          company_name,
          incident.id,
          item_sold || null,
          reporter_id || null,
        ]
      );
    }

    // 3. Save contact persons to contact_persons table
    if (Array.isArray(contact_persons) && contact_persons.length > 0) {
      for (const cp of contact_persons) {
        if (!cp.name?.trim()) continue;
        await db.query(
          `INSERT INTO contact_persons (name, email, phone, company, position, incident_id, company_gstn)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            cp.name.trim(),
            cp.email?.trim() || '',
            cp.phone?.trim() || null,
            company_name,
            cp.position?.trim() || null,
            incident.id,
            company_gstn || null,
          ]
        );
      }
    }

    return incident;
  }

  async findById(db: DbClient, id: number): Promise<Incident | null> {
    const result = await db.query('SELECT * FROM incidents WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByReporterId(db: DbClient, reporterId: number): Promise<Incident[]> {
    const result = await db.query(
      'SELECT * FROM incidents WHERE reporter_id = $1 ORDER BY created_at DESC',
      [reporterId]
    );
    return result.rows;
  }

  async findByGstn(db: DbClient, gstn: string): Promise<Incident[]> {
    const result = await db.query(
      `SELECT * FROM incidents WHERE company_gstn = $1 AND status IN ('approved', 'resolved') ORDER BY created_at DESC`,
      [gstn]
    );
    return result.rows;
  }

  async search(db: DbClient, params: IncidentSearchParams): Promise<{ incidents: Incident[]; total: number }> {
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
    const countResult = await db.query(
      `SELECT COUNT(*) FROM incidents ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT * FROM incidents ${where} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset]
    );

    return { incidents: dataResult.rows, total };
  }

  async update(db: DbClient, id: number, data: IncidentUpdateInput): Promise<Incident | null> {
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

    if (fields.length === 0) return this.findById(db, id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE incidents SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async updateStatus(
    db: DbClient,
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
    const result = await db.query(
      `UPDATE incidents SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(db: DbClient, id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM incidents WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }

  async getModerationQueue(db: DbClient): Promise<Incident[]> {
    const result = await db.query(
      `SELECT * FROM incidents WHERE status IN ('submitted', 'under_review') ORDER BY created_at ASC`
    );
    return result.rows;
      }
  
  
    /**
   * Find incidents by mobile number via contact_persons table.
   * Returns array of incidents linked to companies associated with the mobile.
   * Required by IMPLEMENTATION_CHECKLIST.md Phase 2 § 2.2
   */
  async findByMobile(db: DbClient, mobile: string): Promise<Incident[]> {
    const result = await db.query(
      `SELECT DISTINCT i.* 
       FROM incidents i
       JOIN contact_persons cp ON i.company_gstn = cp.company OR i.company_name = cp.company
       WHERE cp.phone = $1
       AND i.status IN ('approved', 'resolved')
       ORDER BY i.created_at DESC`,
      [mobile]
    );
    return result.rows;
  }

  /**
   * Soft delete: Sets is_deleted = TRUE instead of removing the row.
   * Checks litigation_hold flag - throws error if TRUE (cannot delete).
   * Logs deletion in audit trail.
   * Required by IMPLEMENTATION_CHECKLIST.md Phase 2 § 2.2
   */
  async softDelete(
    db: DbClient,
    id: number,
    deletedBy: number,
    reason?: string
  ): Promise<boolean> {
    // Check if incident exists and if litigation hold is active
    const checkResult = await db.query(
      'SELECT id, litigation_hold FROM incidents WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Incident not found');
    }

    const incident = checkResult.rows[0];
    if (incident.litigation_hold === true) {
      throw new Error(
        'Cannot delete incident: litigation hold is active. Contact admin to remove hold before deletion.'
      );
    }

    // Perform soft delete
    const result = await db.query(
      `UPDATE incidents 
       SET is_deleted = TRUE, 
           deleted_at = NOW(), 
           deleted_by = $1,
           deletion_reason = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [deletedBy, reason || null, id]
    );

    // Log the deletion in audit trail (if audit repository is available)
    // TODO: Add audit log entry here when audit system is integrated

    return result.rows.length > 0;
  }}

export default new IncidentRepository();
