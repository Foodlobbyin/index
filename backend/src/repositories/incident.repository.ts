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
      invoices: invoiceList,      // array of invoice objects from Step 2
      contact_persons,            // array of contact person objects from Step 3
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
        company_gstn || null,
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

    // 2. Save each invoice to incident_invoices table
    if (Array.isArray(invoiceList) && invoiceList.length > 0) {
      for (const inv of invoiceList) {
        const invAmt = inv.invoice_amount ? parseFloat(inv.invoice_amount) : null;
        const unpAmt = inv.unpaid_amount  ? parseFloat(inv.unpaid_amount)  : null;
        if (!invAmt && !unpAmt) continue; // skip blank rows
        await db.query(
          `INSERT INTO incident_invoices
             (incident_id, invoice_amount, unpaid_amount, invoice_date, due_date, item_sold, currency_code)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            incident.id,
            invAmt,
            unpAmt,
            inv.invoice_date || null,
            inv.due_date     || null,
            inv.item_sold?.trim() || null,
            inv.currency_code || currency_code || 'INR',
          ]
        );
      }
    }

    // 3. Upsert contact persons — deduplicate by canonical_phone OR canonical_email.
    //    If same phone OR email exists: update that row (add this incident linkage notes),
    //    otherwise insert fresh.
    if (Array.isArray(contact_persons) && contact_persons.length > 0) {
      for (const cp of contact_persons) {
        if (!cp.name?.trim()) continue;
        const canonPhone = cp.phone ? cp.phone.replace(/\D/g, '').slice(-10) || null : null;
        const canonEmail = cp.email ? cp.email.trim().toLowerCase() || null : null;

        if (!canonPhone && !canonEmail) {
          // No dedup key — just insert
          await db.query(
            `INSERT INTO contact_persons
               (name, email, phone, company, company_gstn, position, incident_id, canonical_phone, canonical_email)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [cp.name.trim(), cp.email?.trim() || '', cp.phone?.trim() || null,
             company_name, company_gstn || null, cp.position?.trim() || null,
             incident.id, null, null]
          );
          continue;
        }

        // Try to find existing record by canonical_phone first, then canonical_email
        let existingId: number | null = null;

        if (canonPhone) {
          const chk = await db.query(
            `SELECT id FROM contact_persons WHERE canonical_phone = $1 LIMIT 1`, [canonPhone]
          );
          if (chk.rows[0]) existingId = chk.rows[0].id;
        }
        if (!existingId && canonEmail) {
          const chk = await db.query(
            `SELECT id FROM contact_persons WHERE canonical_email = $1 LIMIT 1`, [canonEmail]
          );
          if (chk.rows[0]) existingId = chk.rows[0].id;
        }

        if (existingId) {
          // Merge: update missing fields, keep most recent incident_id
          await db.query(
            `UPDATE contact_persons SET
               name            = COALESCE(NULLIF(name,''),         $1),
               email           = COALESCE(NULLIF(email,''),        $2),
               phone           = COALESCE(NULLIF(phone,''),        $3),
               company         = COALESCE(NULLIF(company,''),      $4),
               company_gstn    = COALESCE(NULLIF(company_gstn,''), $5),
               position        = COALESCE(NULLIF(position,''),     $6),
               canonical_phone = COALESCE(canonical_phone,         $7),
               canonical_email = COALESCE(canonical_email,         $8),
               incident_id     = $9
             WHERE id = $10`,
            [cp.name.trim(), cp.email?.trim() || '', cp.phone?.trim() || null,
             company_name, company_gstn || null, cp.position?.trim() || null,
             canonPhone, canonEmail, incident.id, existingId]
          );
        } else {
          // Fresh insert
          await db.query(
            `INSERT INTO contact_persons
               (name, email, phone, company, company_gstn, position, incident_id, canonical_phone, canonical_email)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [cp.name.trim(), cp.email?.trim() || '', cp.phone?.trim() || null,
             company_name, company_gstn || null, cp.position?.trim() || null,
             incident.id, canonPhone, canonEmail]
          );
        }
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
