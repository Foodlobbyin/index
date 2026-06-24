import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import { authMiddleware } from '../middleware/auth.middleware';
import { createDbClient } from '../config/database';

const router = new Hono<AppBindings>();
router.use(authMiddleware);

/**
 * GET /api/contact/lookup?phone=<number>
 * Look up a single contact person by exact phone for Step 3 auto-fill.
 * Returns the first matching contact person (deduplicated by canonical_phone).
 */
router.get('/lookup', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const raw = c.req.query('phone')?.replace(/\D/g, '') || '';
  if (raw.length < 5) {
    return c.json({ contact: null });
  }
  // Match last 10 digits (canonical form)
  const canon = raw.slice(-10);

  const result = await db.query(
    `SELECT DISTINCT ON (COALESCE(cp.canonical_phone, cp.canonical_email, cp.id::text))
       cp.id, cp.name, cp.email, cp.phone, cp.position,
       cp.company, cp.company_gstn, cp.canonical_phone, cp.canonical_email
     FROM contact_persons cp
     WHERE cp.canonical_phone = $1
        OR REGEXP_REPLACE(COALESCE(cp.phone,''), '[^0-9]', '', 'g') LIKE $2
     ORDER BY COALESCE(cp.canonical_phone, cp.canonical_email, cp.id::text), cp.id
     LIMIT 1`,
    [canon, `%${canon}`]
  );

  return c.json({ contact: result.rows[0] || null });
});

/**
 * GET /api/contact/search?phone=<number>
 * Search contact persons by phone number (partial match on canonical_phone or phone).
 * Returns deduplicated persons. Same phone = same person.
 */
router.get('/search', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const phone = c.req.query('phone')?.replace(/\D/g, '') || '';

  if (phone.length < 5) {
    return c.json({ error: 'Provide at least 5 digits of the phone number.' }, 400);
  }

  const result = await db.query(
    `SELECT DISTINCT ON (
       COALESCE(cp.canonical_phone, cp.canonical_email, cp.id::text)
     )
       cp.id,
       cp.name,
       cp.email,
       cp.phone,
       cp.position,
       cp.company,
       cp.company_gstn,
       cp.canonical_phone,
       cp.canonical_email,
       COUNT(DISTINCT i.company_gstn)::int  AS company_count,
       COUNT(DISTINCT i.id)::int             AS incident_count
     FROM contact_persons cp
     LEFT JOIN incidents i ON i.id = cp.incident_id
     WHERE
       REGEXP_REPLACE(COALESCE(cp.phone, ''), '[^0-9]', '', 'g') LIKE $1
       OR cp.canonical_phone LIKE $1
     GROUP BY
       cp.id, cp.name, cp.email, cp.phone, cp.position,
       cp.company, cp.company_gstn, cp.canonical_phone, cp.canonical_email
     ORDER BY
       COALESCE(cp.canonical_phone, cp.canonical_email, cp.id::text),
       cp.id
     LIMIT 30`,
    [`%${phone}%`]
  );

  return c.json({ contacts: result.rows });
});

/**
 * GET /api/contact/:id
 * Contact person profile: companies they are linked to + summary stats per company.
 * Uses contact_person_companies view.
 */
router.get('/:id', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json({ error: 'Invalid contact person id.' }, 400);

  // Fetch contact person details
  const personResult = await db.query(
    `SELECT id, name, email, phone, position, company, company_gstn,
            canonical_phone, canonical_email
     FROM contact_persons WHERE id = $1`,
    [id]
  );
  if (!personResult.rows[0]) return c.json({ error: 'Contact person not found.' }, 404);
  const person = personResult.rows[0];

  // All contact_persons rows that share same canonical_phone or canonical_email
  // (i.e. the same physical person under different entries)
  const allIds: number[] = [id];
  if (person.canonical_phone) {
    const r = await db.query(
      `SELECT id FROM contact_persons WHERE canonical_phone = $1`, [person.canonical_phone]
    );
    r.rows.forEach((row: any) => { if (!allIds.includes(row.id)) allIds.push(row.id); });
  }
  if (person.canonical_email) {
    const r = await db.query(
      `SELECT id FROM contact_persons WHERE canonical_email = $1`, [person.canonical_email]
    );
    r.rows.forEach((row: any) => { if (!allIds.includes(row.id)) allIds.push(row.id); });
  }

  // Companies + stats via the view — for all merged person IDs
  const companiesResult = await db.query(
    `SELECT
       cpc.company_name,
       cpc.company_gstn,
       SUM(cpc.incident_count)::int          AS incident_count,
       SUM(cpc.total_invoice_amount)         AS total_invoice_amount,
       SUM(cpc.total_unpaid)                 AS total_unpaid
     FROM contact_person_companies cpc
     WHERE cpc.contact_person_id = ANY($1::int[])
     GROUP BY cpc.company_name, cpc.company_gstn
     ORDER BY total_invoice_amount DESC NULLS LAST`,
    [allIds]
  );

  return c.json({
    person,
    companies: companiesResult.rows,
  });
});

export default router;
