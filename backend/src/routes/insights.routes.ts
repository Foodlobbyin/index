import { Router } from 'express';
import invoiceController from '../controllers/invoice.controller';

const router = Router();

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
router.get('/', (req, res) => invoiceController.getMarketInsights(req, res));

export default router;
