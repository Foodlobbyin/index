import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import invoiceController from '../controllers/invoice.controller';
import { createDbClient } from '../config/database';

const router = new Hono<AppBindings>();

/**
 * @openapi
 * /api/insights:
 *   get:
 *     tags:
 *       - Insights
 *     summary: Get market insights
 *     description: |
 *       Retrieve aggregated, anonymized market insights including:
 *       - Total companies and average metrics
 *       - Industry breakdowns
 *       - Revenue and employee statistics
 *       - Invoice trends
 *       
 *       This endpoint provides anonymized data for market analysis.
 *     parameters:
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter insights by specific industry
 *         example: Technology
 *     responses:
 *       200:
 *         description: Market insights data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MarketInsights'
 *             examples:
 *               general:
 *                 summary: General market insights
 *                 value:
 *                   total_companies: 150
 *                   average_revenue: 2500000.00
 *                   average_employees: 35
 *                   total_invoiced: 15000000.00
 *                   by_industry:
 *                     - industry: Technology
 *                       count: 45
 *                       avg_revenue: 3200000.00
 *                       avg_employees: 42
 *                     - industry: Manufacturing
 *                       count: 38
 *                       avg_revenue: 2800000.00
 *                       avg_employees: 55
 *               filtered:
 *                 summary: Technology industry insights
 *                 value:
 *                   total_companies: 45
 *                   average_revenue: 3200000.00
 *                   average_employees: 42
 *                   total_invoiced: 4500000.00
 *                   by_industry:
 *                     - industry: Technology
 *                       count: 45
 *                       avg_revenue: 3200000.00
 *                       avg_employees: 42
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', invoiceController.getMarketInsights);

/**
 * GET /api/insights/dashboard
 * Real-time dashboard KPI stats from the database.
 */
router.get('/dashboard', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  try {
    const [incidentStats, monthlyIncidents, incidentByType] = await Promise.all([
      // Total unique companies reported, total incidents, resolved count
      db.query(`
        SELECT
          COUNT(*)::int                                                          AS total_incidents,
          COUNT(DISTINCT company_gstn)::int                                     AS total_companies,
          COUNT(*) FILTER (WHERE status = 'resolved')::int                      AS resolved_issues,
          COUNT(*) FILTER (WHERE status IN ('approved','under_review','pending_review'))::int AS active_incidents
        FROM incidents
      `),
      // Incidents reported per month (last 6 months)
      db.query(`
        SELECT
          TO_CHAR(created_at, 'Mon') AS month,
          EXTRACT(MONTH FROM created_at)::int AS month_num,
          EXTRACT(YEAR FROM created_at)::int AS year,
          COUNT(*) FILTER (WHERE status = 'resolved')::int  AS paid,
          COUNT(*) FILTER (WHERE status != 'resolved')::int AS unpaid
        FROM incidents
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month, month_num, year
        ORDER BY year, month_num
      `),
      // Breakdown by incident type
      db.query(`
        SELECT
          REPLACE(incident_type, '_', ' ') AS status,
          COUNT(*)::int                    AS count,
          COALESCE(SUM(amount_involved), 0)::float AS value
        FROM incidents
        GROUP BY incident_type
        ORDER BY count DESC
      `),
    ]);

    return c.json({
      totalCompanies:   incidentStats.rows[0]?.total_companies ?? 0,
      totalInvoices:    incidentStats.rows[0]?.total_incidents ?? 0,
      unpaidInvoices:   incidentStats.rows[0]?.active_incidents ?? 0,
      resolvedIssues:   incidentStats.rows[0]?.resolved_issues ?? 0,
      invoicesByMonth:  monthlyIncidents.rows,
      invoicesByStatus: incidentByType.rows,
    });
  } catch (err: any) {
    console.error('Dashboard stats error:', err);
    return c.json({ error: 'Failed to load dashboard stats.' }, 500);
  }
});

/**
 * GET /api/insights/states
 * Returns incident and company counts grouped by Indian state (derived from GSTIN prefix).
 */
router.get('/states', async (c) => {
  const db = createDbClient(c.env.DATABASE_URL);
  try {
    const result = await db.query(`
      SELECT
        SUBSTRING(company_gstn, 1, 2)            AS state_code,
        COUNT(*)::int                            AS incident_count,
        COUNT(DISTINCT company_gstn)::int        AS company_count
      FROM incidents
      WHERE LENGTH(company_gstn) = 15
      GROUP BY state_code
      ORDER BY incident_count DESC
    `);
    return c.json({ states: result.rows });
  } catch (err: any) {
    console.error('States stats error:', err);
    return c.json({ error: 'Failed to load state data.' }, 500);
  }
});

export default router;
