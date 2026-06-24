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
