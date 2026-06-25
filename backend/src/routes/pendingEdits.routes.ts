import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireMinTrustLevel } from '../middleware/trustLevel.middleware';
import { createDbClient } from '../config/database';

const router = new Hono<AppBindings>();
router.use(authMiddleware);

/**
 * POST /api/pending-edits
 * Submit a proposed edit for any incident (any status).
 * For draft incidents: apply immediately (no review needed).
 * For non-draft: store in pending_incident_edits, mark incident has_pending_edit = true.
 */
router.post('/', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  try {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Authentication required' }, 401);

    const body = await c.req.json();
    const { incident_id, new_data, new_invoices = [], new_contacts = [] } = body;

    if (!incident_id || !new_data) {
      return c.json({ error: 'incident_id and new_data are required' }, 400);
    }

    // Fetch the current incident
    const incResult = await db.query(
      'SELECT * FROM incidents WHERE id = $1',
      [incident_id]
    );
    if (!incResult.rows[0]) return c.json({ error: 'Incident not found' }, 404);
    const incident = incResult.rows[0];

    // Only the reporter can edit
    if (incident.reporter_id !== user.id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // For DRAFT incidents: apply edit directly
    if (incident.status === 'draft') {
      // Update core incident fields
      const fields: string[] = [];
      const vals: any[] = [];
      let idx = 1;
      const allowed = ['company_gstn','company_name','state','pincode','street_address',
        'msme_udyam_number','incident_type','incident_date','incident_title','description',
        'amount_involved','currency_code'];
      for (const key of allowed) {
        if (new_data[key] !== undefined) {
          fields.push(`${key} = $${idx++}`);
          vals.push(new_data[key]);
        }
      }
      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        vals.push(incident_id);
        await db.query(
          `UPDATE incidents SET ${fields.join(', ')} WHERE id = $${idx}`,
          vals
        );
      }

      // Replace invoices if provided
      if (Array.isArray(new_invoices) && new_invoices.length > 0) {
        await db.query('DELETE FROM incident_invoices WHERE incident_id = $1', [incident_id]);
        for (const inv of new_invoices) {
          if (!inv.invoice_amount && !inv.unpaid_amount) continue;
          await db.query(
            `INSERT INTO incident_invoices (incident_id, invoice_number, invoice_amount, unpaid_amount, invoice_date, due_date, item_sold, currency_code)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [incident_id, inv.invoice_number?.trim() || null, inv.invoice_amount || null, inv.unpaid_amount || null,
             inv.invoice_date || null, inv.due_date || null, inv.item_sold || null,
             inv.currency_code || new_data.currency_code || 'INR']
          );
        }
      }

      // Replace contacts if provided
      if (Array.isArray(new_contacts) && new_contacts.length > 0) {
        await db.query('DELETE FROM contact_persons WHERE incident_id = $1', [incident_id]);
        for (const cp of new_contacts) {
          if (!cp.name?.trim()) continue;
          const canonPhone = cp.phone ? cp.phone.replace(/\D/g,'').slice(-10) || null : null;
          const canonEmail = cp.email ? cp.email.trim().toLowerCase() || null : null;
          await db.query(
            `INSERT INTO contact_persons (name, email, phone, company, company_gstn, position, incident_id, canonical_phone, canonical_email)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [cp.name.trim(), cp.email?.trim() || '', cp.phone?.trim() || null,
             new_data.company_name || incident.company_name, new_data.company_gstn || incident.company_gstn || null,
             cp.position?.trim() || null, incident_id, canonPhone, canonEmail]
          );
        }
      }

      const updated = await db.query('SELECT * FROM incidents WHERE id = $1', [incident_id]);
      return c.json({ message: 'Draft updated directly', incident: updated.rows[0] }, 200);
    }

    // For NON-DRAFT incidents: store as pending edit

    // Fetch old invoices and contacts
    const oldInvResult = await db.query(
      'SELECT * FROM incident_invoices WHERE incident_id = $1 ORDER BY id',
      [incident_id]
    );
    const oldContactResult = await db.query(
      'SELECT * FROM contact_persons WHERE incident_id = $1 ORDER BY id',
      [incident_id]
    );

    // Check if there's already a pending edit for this incident — reject if so
    const existingPending = await db.query(
      `SELECT id FROM pending_incident_edits WHERE incident_id = $1 AND status = 'pending'`,
      [incident_id]
    );
    if (existingPending.rows.length > 0) {
      return c.json({ error: 'This incident already has a pending edit awaiting review. Wait for it to be processed before submitting another.' }, 409);
    }

    await db.query(
      `INSERT INTO pending_incident_edits (
        incident_id, requested_by,
        old_company_gstn, old_company_name, old_state, old_pincode, old_street_address,
        old_msme_udyam_number, old_incident_type, old_incident_date, old_incident_title,
        old_description, old_amount_involved, old_currency_code,
        new_company_gstn, new_company_name, new_state, new_pincode, new_street_address,
        new_msme_udyam_number, new_incident_type, new_incident_date, new_incident_title,
        new_description, new_amount_involved, new_currency_code,
        old_invoices, new_invoices, old_contacts, new_contacts
      ) VALUES (
        $1,$2,
        $3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
        $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,
        $27,$28,$29,$30
      )`,
      [
        incident_id, user.id,
        incident.company_gstn, incident.company_name, incident.state, incident.pincode,
        incident.street_address, incident.msme_udyam_number, incident.incident_type,
        incident.incident_date, incident.incident_title, incident.description,
        incident.amount_involved, incident.currency_code,
        new_data.company_gstn ?? incident.company_gstn,
        new_data.company_name ?? incident.company_name,
        new_data.state ?? incident.state,
        new_data.pincode ?? incident.pincode,
        new_data.street_address ?? incident.street_address,
        new_data.msme_udyam_number ?? incident.msme_udyam_number,
        new_data.incident_type ?? incident.incident_type,
        new_data.incident_date ?? incident.incident_date,
        new_data.incident_title ?? incident.incident_title,
        new_data.description ?? incident.description,
        new_data.amount_involved ?? incident.amount_involved,
        new_data.currency_code ?? incident.currency_code,
        JSON.stringify(oldInvResult.rows),
        JSON.stringify(new_invoices),
        JSON.stringify(oldContactResult.rows),
        JSON.stringify(new_contacts),
      ]
    );

    return c.json({ message: 'Edit submitted for moderation review. Original data unchanged until approved.' }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /api/pending-edits/my
 * Get all pending edits for the logged-in user's incidents.
 */
router.get('/my', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  try {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Authentication required' }, 401);
    const result = await db.query(
      `SELECT pe.*, i.company_name, i.incident_title, i.status AS incident_status
       FROM pending_incident_edits pe
       JOIN incidents i ON i.id = pe.incident_id
       WHERE pe.requested_by = $1
       ORDER BY pe.created_at DESC`,
      [user.id]
    );
    return c.json({ pending_edits: result.rows });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /api/pending-edits/queue  (moderator only)
 * All pending edits awaiting review.
 */
router.get('/queue', requireMinTrustLevel('moderator'), async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  try {
    const result = await db.query(
      `SELECT pe.*, i.company_name, i.incident_title, i.status AS incident_status,
              u.id AS requester_user_id
       FROM pending_incident_edits pe
       JOIN incidents i ON i.id = pe.incident_id
       LEFT JOIN users u ON u.id = pe.requested_by
       WHERE pe.status = 'pending'
       ORDER BY pe.created_at ASC`
    );
    return c.json({ pending_edits: result.rows });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PUT /api/pending-edits/:id/approve  (moderator only)
 * Approve an edit: apply new_data to the incident.
 */
router.put('/:id/approve', requireMinTrustLevel('moderator'), async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  try {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Authentication required' }, 401);
    const editId = parseInt(c.req.param('id'), 10);
    if (isNaN(editId)) return c.json({ error: 'Invalid edit ID' }, 400);
    const { notes } = await c.req.json().catch(() => ({ notes: undefined }));

    const editResult = await db.query(
      `SELECT * FROM pending_incident_edits WHERE id = $1 AND status = 'pending'`,
      [editId]
    );
    if (!editResult.rows[0]) return c.json({ error: 'Pending edit not found or already processed' }, 404);
    const edit = editResult.rows[0];

    // Apply new core fields to incident
    await db.query(
      `UPDATE incidents SET
        company_gstn = $1, company_name = $2, state = $3, pincode = $4,
        street_address = $5, msme_udyam_number = $6, incident_type = $7,
        incident_date = $8, incident_title = $9, description = $10,
        amount_involved = $11, currency_code = $12,
        updated_at = NOW()
       WHERE id = $13`,
      [
        edit.new_company_gstn, edit.new_company_name, edit.new_state, edit.new_pincode,
        edit.new_street_address, edit.new_msme_udyam_number, edit.new_incident_type,
        edit.new_incident_date, edit.new_incident_title, edit.new_description,
        edit.new_amount_involved, edit.new_currency_code,
        edit.incident_id
      ]
    );

    // Replace invoices with new_invoices
    const newInvoices = Array.isArray(edit.new_invoices) ? edit.new_invoices : JSON.parse(edit.new_invoices || '[]');
    await db.query('DELETE FROM incident_invoices WHERE incident_id = $1', [edit.incident_id]);
    for (const inv of newInvoices) {
      if (!inv.invoice_amount && !inv.unpaid_amount) continue;
      await db.query(
        `INSERT INTO incident_invoices (incident_id, invoice_amount, unpaid_amount, invoice_date, due_date, item_sold, currency_code)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [edit.incident_id, inv.invoice_number?.trim() || null, inv.invoice_amount || null, inv.unpaid_amount || null,
         inv.invoice_date || null, inv.due_date || null, inv.item_sold || null,
         inv.currency_code || edit.new_currency_code || 'INR']
      );
    }

    // Replace contacts with new_contacts
    const newContacts = Array.isArray(edit.new_contacts) ? edit.new_contacts : JSON.parse(edit.new_contacts || '[]');
    await db.query('DELETE FROM contact_persons WHERE incident_id = $1', [edit.incident_id]);
    for (const cp of newContacts) {
      if (!cp.name?.trim()) continue;
      const canonPhone = cp.phone ? cp.phone.replace(/\D/g,'').slice(-10) || null : null;
      const canonEmail = cp.email ? cp.email.trim().toLowerCase() || null : null;
      await db.query(
        `INSERT INTO contact_persons (name, email, phone, company, company_gstn, position, incident_id, canonical_phone, canonical_email)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [cp.name.trim(), cp.email?.trim() || '', cp.phone?.trim() || null,
         edit.new_company_name, edit.new_company_gstn || null,
         cp.position?.trim() || null, edit.incident_id, canonPhone, canonEmail]
      );
    }

    // Mark edit as approved
    await db.query(
      `UPDATE pending_incident_edits SET status='approved', reviewed_by=$1, reviewed_at=NOW(), moderator_notes=$2, updated_at=NOW() WHERE id=$3`,
      [user.id, notes || null, editId]
    );

    return c.json({ message: 'Edit approved and applied to incident' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PUT /api/pending-edits/:id/reject  (moderator only)
 * Reject an edit: original incident data stays intact.
 */
router.put('/:id/reject', requireMinTrustLevel('moderator'), async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  try {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Authentication required' }, 401);
    const editId = parseInt(c.req.param('id'), 10);
    if (isNaN(editId)) return c.json({ error: 'Invalid edit ID' }, 400);
    const { reason, notes } = await c.req.json();
    if (!reason?.trim()) return c.json({ error: 'Rejection reason is required' }, 400);

    const editResult = await db.query(
      `SELECT id FROM pending_incident_edits WHERE id = $1 AND status = 'pending'`,
      [editId]
    );
    if (!editResult.rows[0]) return c.json({ error: 'Pending edit not found or already processed' }, 404);

    await db.query(
      `UPDATE pending_incident_edits SET status='rejected', reviewed_by=$1, reviewed_at=NOW(), rejection_reason=$2, moderator_notes=$3, updated_at=NOW() WHERE id=$4`,
      [user.id, reason, notes || null, editId]
    );

    return c.json({ message: 'Edit rejected. Original incident data unchanged.' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default router;
