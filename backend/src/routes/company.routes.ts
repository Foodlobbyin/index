import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import companyController from '../controllers/company.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createDbClient } from '../config/database';

const router = new Hono<AppBindings>();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/company/search
 * Search companies by GSTN (exact) or phone number (partial match)
 * Returns company_profiles joined with users for GSTN/phone data
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
    // Search incidents by GSTN — returns distinct companies that have been reported
    const result = await db.query(
      `SELECT
         MIN(i.id)::int                                     AS company_id,
         MAX(i.company_name)                               AS company_name,
         NULL::text                                        AS industry,
         NULL::text                                        AS city,
         NULL::text                                        AS country,
         NULL::int                                         AS reputation_score,
         i.company_gstn                                    AS gstn,
         NULL::text                                        AS phone_number,
         COUNT(*)::int                                     AS invoice_count,
         COALESCE(SUM(CASE WHEN i.status NOT IN ('resolved') THEN i.amount_involved ELSE 0 END), 0) AS unpaid_amount
       FROM incidents i
       WHERE i.company_gstn = $1
       GROUP BY i.company_gstn
       ORDER BY company_name`,
      [gstn.toUpperCase()]
    );
    rows = result.rows;
  } else {
    // Search contact_persons by phone, then find matching incidents by company name
    const clean = (phone as string).replace(/\D/g, '');
    const result = await db.query(
      `SELECT
         MIN(i.id)::int                                     AS company_id,
         MAX(i.company_name)                               AS company_name,
         NULL::text                                        AS industry,
         NULL::text                                        AS city,
         NULL::text                                        AS country,
         NULL::int                                         AS reputation_score,
         i.company_gstn                                    AS gstn,
         cp_sub.phone                                      AS phone_number,
         COUNT(DISTINCT i.id)::int                         AS invoice_count,
         COALESCE(SUM(CASE WHEN i.status NOT IN ('resolved') THEN i.amount_involved ELSE 0 END), 0) AS unpaid_amount
       FROM incidents i
       JOIN contact_persons cp_sub ON LOWER(cp_sub.company) = LOWER(i.company_name)
       WHERE REGEXP_REPLACE(COALESCE(cp_sub.phone, ''), '[^0-9]', '', 'g') LIKE $1
       GROUP BY i.company_gstn, cp_sub.phone
       ORDER BY company_name
       LIMIT 20`,
      [`%${clean}%`]
    );
    rows = result.rows;
  }

  return c.json({ results: rows });
});

/**
 * GET /api/company/view/:id
 * Public company view by company_profiles.id (for search result navigation)
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
 * Company profile: all incidents, all invoices from incident_invoices,
 * and deduplicated contact persons — linked by company_gstn or company_name.
 */
router.get('/view-by-gstn', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const gstn = c.req.query('gstn');
  const name = c.req.query('name');

  if (!gstn && !name) {
    return c.json({ error: 'Provide gstn or name query parameter.' }, 400);
  }

  const param = gstn ? gstn.toUpperCase() : (name as string);
  const byGstn = !!gstn;

  // Fetch all incidents for this company (approved/submitted/under_review/resolved)
  const incidentsResult = await db.query(
    byGstn
      ? `SELECT id, company_name, company_gstn, incident_type, status, created_at
         FROM incidents
         WHERE company_gstn = $1 AND status IN ('approved','submitted','under_review','resolved')
         ORDER BY created_at DESC`
      : `SELECT id, company_name, company_gstn, incident_type, status, created_at
         FROM incidents
         WHERE LOWER(company_name) = LOWER($1) AND status IN ('approved','submitted','under_review','resolved')
         ORDER BY created_at DESC`,
    [param]
  );

  if (incidentsResult.rows.length === 0) {
    return c.json({ error: 'No incidents found for this company.' }, 404);
  }

  const companyName: string = incidentsResult.rows[0].company_name;
  const companyGstn: string = incidentsResult.rows[0].company_gstn || gstn || '';
  const incidentIds: number[] = incidentsResult.rows.map((r: any) => r.id);

  // Fetch all invoices from incident_invoices for these incidents
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

  // Fetch deduplicated contact persons for this company
  // Group by canonical_phone OR canonical_email; pick the canonical row per person.
  const contactsResult = await db.query(
    `SELECT DISTINCT ON (
       COALESCE(cp.canonical_phone, cp.canonical_email, cp.id::text)
     )
       cp.id, cp.name, cp.email, cp.phone, cp.position, cp.company_gstn,
       cp.canonical_phone, cp.canonical_email
     FROM contact_persons cp
     WHERE cp.incident_id = ANY($1::int[])
        OR (cp.company_gstn IS NOT NULL AND cp.company_gstn = $2)
        OR LOWER(cp.company) = LOWER($3)
     ORDER BY
       COALESCE(cp.canonical_phone, cp.canonical_email, cp.id::text),
       cp.id`,
    [incidentIds, companyGstn || '', companyName]
  );

  // Compute totals
  const totalUnpaid = invoicesResult.rows
    .filter((i: any) => i.incident_status !== 'resolved')
    .reduce((sum: number, i: any) => {
      return sum + parseFloat(i.unpaid_amount ?? i.invoice_amount ?? 0);
    }, 0);

  return c.json({
    company_name: companyName,
    gstn: companyGstn,
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
