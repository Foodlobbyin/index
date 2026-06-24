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
    const [companies, invoices, incidents, monthlyInvoices, statusBreakdown] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS total FROM company_profiles cp JOIN users u ON u.id = cp.user_id WHERE u.registration_status = 'active'`),
      db.query(`
        SELECT
          COUNT(*)::int                                                              AS total_invoices,
          COUNT(*) FILTER (WHERE status != 'paid')::int                             AS unpaid_invoices
        FROM invoices
      `),
      db.query(`SELECT COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved_issues FROM incidents`),
      db.query(`
        SELECT
          TO_CHAR(created_at, 'Mon') AS month,
          EXTRACT(MONTH FROM created_at)::int AS month_num,
          EXTRACT(YEAR FROM created_at)::int AS year,
          COUNT(*) FILTER (WHERE status = 'paid')::int   AS paid,
          COUNT(*) FILTER (WHERE status != 'paid')::int  AS unpaid
        FROM invoices
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month, month_num, year
        ORDER BY year, month_num
      `),
      db.query(`
        SELECT
          INITCAP(status) AS status,
          COUNT(*)::int   AS count,
          COALESCE(SUM(amount), 0)::float AS value
        FROM invoices
        GROUP BY status
        ORDER BY count DESC
      `),
    ]);

    return c.json({
      totalCompanies:  companies.rows[0]?.total ?? 0,
      totalInvoices:   invoices.rows[0]?.total_invoices ?? 0,
      unpaidInvoices:  invoices.rows[0]?.unpaid_invoices ?? 0,
      resolvedIssues:  incidents.rows[0]?.resolved_issues ?? 0,
      invoicesByMonth: monthlyInvoices.rows,
      invoicesByStatus: statusBreakdown.rows,
    });
  } catch (err: any) {
    console.error('Dashboard stats error:', err);
    return c.json({ error: 'Failed to load dashboard stats.' }, 500);
  }
});

export default router;
