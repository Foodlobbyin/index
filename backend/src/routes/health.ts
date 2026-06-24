import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';

const router = new Hono<AppBindings>();

/**
 * @openapi
 * /api/health/db:
 *   get:
 *     tags:
 *       - Health
 *     summary: Database health check
 *     description: Runs SELECT 1 against the database and returns connection status
 *     responses:
 *       200:
 *         description: Database is connected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 db:
 *                   type: string
 *                   example: connected
 *       500:
 *         description: Database connection error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 db:
 *                   type: string
 *                   example: disconnected
 *                 message:
 *                   type: string
 */
router.get('/db', async (c) => {
  try {
    const db = createDbClient(c.env.DATABASE_URL);
    await db.query('SELECT 1');
    return c.json({ status: 'ok', database: 'connected' });
  } catch (e) {
    return c.json({ status: 'error', database: 'disconnected' }, 500);
  }
});

export default router;
