import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import companyController from '../controllers/company.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createDbClient } from '../config/database';

const router = new Hono<AppBindings>();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/company/lookup?gstn=<GSTN>
 * Public lookup of a company by GSTN from the master companies table.
 * Used by ReportIncidentPage Step 1 for auto-fill.
 * Returns: { company: { gstn, company_name, state, pincode, street_address, msme_udyam_number, industry } }
 */
router.get('/lookup', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const gstn = c.req.query('gstn')?.trim().toUpperCase();

  if (!gstn || gstn.length < 10) {
    return c.json({ error: 'Provide a valid GSTN query parameter.' }, 400);
  }

  const result = await db.query(
    `SELECT
       id, gstn, company_name, state, pincode, street_address,
       msme_udyam_number, industry, is_registered_member
     FROM companies
     WHERE gstn = $1`,
    [gstn]
  );

  if (!result.rows[0]) {
    return c.json({ company: null });
  }

  return c.json({ company: result.rows[0] });
});

/**
 * GET /api/company/search
 * Search companies by GSTN (exact) or phone number (partial match on contact_persons).
 * Now queries the master companies table + incident_invoices for totals.
 */
router.get('/search', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const gstn = c.req.query('gstn');
  const phone = c.req.query('phone');

  if (!gstn && !phone) {
    return c.json({ error: 'Provide gstn or phone query parameter.' }, 400);
  }

  let rows;

  if (gstn) {
    // Look up company in master companies table, then aggregate incident stats
    const result = await db.query(
      `SELECT
         co.id                                                              AS company_id,
         co.company_name,
         co.industry,
         co.state                                                           AS city,
         NULL::text                                                         AS country,
         NULL::int                                                          AS reputation_score,
         co.gstn,
         NULL::text                                                         AS phone_number,
         COUNT(DISTINCT i.id)::int                                          AS invoice_count,
         COALESCE(SUM(
           CASE WHEN i.status NOT IN ('resolved')
             THEN COALESCE(ii_totals.total_unpaid, 0) ELSE 0 END
         ), 0)                                                              AS unpaid_amount
       FROM companies co
       LEFT JOIN incidents i        ON i.company_id = co.id
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(COALESCE(ii.unpaid_amount, ii.invoice_amount)), 0) AS total_unpaid
         FROM incident_invoices ii
         WHERE ii.incident_id = i.id
       ) ii_totals                  ON TRUE
       WHERE co.gstn = $1
       GROUP BY co.id, co.company_name, co.industry, co.state, co.gstn`,
      [gstn.toUpperCase()]
    );
    rows = result.rows;
  } else {
    // Search contact_persons by phone, find their incidents, then return the companies
    const clean = (phone as string).replace(/\D/g, '');
    const result = await db.query(
      `SELECT
         co.id                                                              AS company_id,
         co.company_name,
         co.industry,
         co.state                                                           AS city,
         NULL::text                                                         AS country,
         NULL::int                                                          AS reputation_score,
         co.gstn,
         cp_sub.phone                                                       AS phone_number,
         COUNT(DISTINCT i.id)::int                                          AS invoice_count,
         COALESCE(SUM(
           CASE WHEN i.status NOT IN ('resolved')
             THEN COALESCE(ii_totals.total_unpaid, 0) ELSE 0 END
         ), 0)                                                              AS unpaid_amount
       FROM contact_persons cp_sub
       JOIN incidents i             ON i.id = cp_sub.incident_id
       JOIN companies co            ON co.id = i.company_id
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(COALESCE(ii.unpaid_amount, ii.invoice_amount)), 0) AS total_unpaid
         FROM incident_invoices ii
         WHERE ii.incident_id = i.id
       ) ii_totals                  ON TRUE
       WHERE REGEXP_REPLACE(COALESCE(cp_sub.phone, ''), '[^0-9]', '', 'g') LIKE $1
          OR cp_sub.canonical_phone LIKE $1
       GROUP BY co.id, co.company_name, co.industry, co.state, co.gstn, cp_sub.phone
       ORDER BY co.company_name
       LIMIT 20`,
      [`%${clean}%`]
    );
    rows = result.rows;
  }

  return c.json({ results: rows });
});

/**
 * GET /api/company/view/:id
 * Public company view by company_profiles.id (for registered member profile).
 */
router.get('/view/:id', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid company id.' }, 400);

  const result = await db.query(
    `SELECT
       cp.*,
       u.gstn,
       u.phone_number,
       u.first_name,
       u.last_name,
       u.registration_status,
       COUNT(DISTINCT inv.id)::int AS invoice_count,
       COALESCE(SUM(CASE WHEN inv.status != 'paid' THEN inv.amount ELSE 0 END), 0) AS unpaid_amount,
       COALESCE(SUM(inv.amount), 0) AS total_invoice_amount
     FROM company_profiles cp
     JOIN users u ON u.id = cp.user_id
     LEFT JOIN invoices inv ON inv.company_id = cp.id
     WHERE cp.id = $1
       AND u.registration_status = 'active'
     GROUP BY cp.id, u.gstn, u.phone_number, u.first_name, u.last_name, u.registration_status`,
    [id]
  );

  if (!result.rows[0]) return c.json({ error: 'Company not found.' }, 404);
  return c.json({ company: result.rows[0] });
});


/**
 * GET /api/company/view-by-gstn
 * Company profile page: all incidents, all invoices from incident_invoices,
 * and deduplicated contact persons.
 * Now uses the master companies table as the anchor.
 */
router.get('/view-by-gstn', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const gstn = c.req.query('gstn');
  const name = c.req.query('name');

  if (!gstn && !name) {
    return c.json({ error: 'Provide gstn or name query parameter.' }, 400);
  }

  // Step 1: Resolve company from master table
  let companyRow: any = null;
  if (gstn) {
    const r = await db.query(
      `SELECT id, gstn, company_name, state, pincode, street_address, msme_udyam_number, industry, is_registered_member
       FROM companies WHERE gstn = $1`,
      [gstn.toUpperCase()]
    );
    companyRow = r.rows[0] || null;
  } else {
    const r = await db.query(
      `SELECT id, gstn, company_name, state, pincode, street_address, msme_udyam_number, industry, is_registered_member
       FROM companies WHERE LOWER(TRIM(company_name)) = LOWER(TRIM($1)) ORDER BY id LIMIT 1`,
      [name as string]
    );
    companyRow = r.rows[0] || null;
  }

  if (!companyRow) {
    return c.json({ error: 'Company not found.' }, 404);
  }

  const companyId: number = companyRow.id;

  // Step 2: Fetch all approved/visible incidents for this company
  const incidentsResult = await db.query(
    `SELECT id, company_name, company_gstn, incident_type, status, created_at
     FROM incidents
     WHERE company_id = $1
       AND status IN ('approved', 'submitted', 'under_review', 'resolved')
     ORDER BY created_at DESC`,
    [companyId]
  );

  if (incidentsResult.rows.length === 0) {
    return c.json({ error: 'No incidents found for this company.' }, 404);
  }

  const incidentIds: number[] = incidentsResult.rows.map((r: any) => r.id);

  // Step 3: All invoices from incident_invoices for these incidents
  const invoicesResult = await db.query(
    `SELECT
       ii.id, ii.incident_id, ii.invoice_amount, ii.unpaid_amount,
       ii.invoice_date, ii.due_date, ii.item_sold, ii.currency_code,
       i.incident_type AS category, i.status AS incident_status
     FROM incident_invoices ii
     JOIN incidents i ON i.id = ii.incident_id
     WHERE ii.incident_id = ANY($1::int[])
     ORDER BY ii.invoice_date DESC NULLS LAST, ii.created_at DESC`,
    [incidentIds]
  );

  // Step 4: Deduplicated contact persons linked to this company's incidents
  const contactsResult = await db.query(
    `SELECT DISTINCT ON (
       COALESCE(cp.canonical_phone, cp.canonical_email, cp.id::text)
     )
       cp.id, cp.name, cp.email, cp.phone, cp.position, cp.company_gstn,
       cp.canonical_phone, cp.canonical_email
     FROM contact_persons cp
     WHERE cp.incident_id = ANY($1::int[])
     ORDER BY
       COALESCE(cp.canonical_phone, cp.canonical_email, cp.id::text),
       cp.id`,
    [incidentIds]
  );

  // Step 5: Compute totals
  const totalUnpaid = invoicesResult.rows
    .filter((i: any) => i.incident_status !== 'resolved')
    .reduce((sum: number, i: any) => {
      return sum + parseFloat(i.unpaid_amount ?? i.invoice_amount ?? 0);
    }, 0);

  return c.json({
    company: companyRow,
    company_name: companyRow.company_name,
    gstn: companyRow.gstn || '',
    total_incidents: incidentsResult.rows.length,
    total_invoices: invoicesResult.rows.length,
    total_unpaid: totalUnpaid,
    invoices: invoicesResult.rows,
    contact_persons: contactsResult.rows,
  });
});


/**
 * POST /api/company
 */
router.post('/', companyController.createCompany);

/**
 * GET /api/company
 * Get own company profile
 */
router.get('/', companyController.getCompany);

/**
 * PUT /api/company/:id
 */
router.put('/:id', companyController.updateCompany);

/**
 * DELETE /api/company/:id
 */
router.delete('/:id', companyController.deleteCompany);

export default router;
