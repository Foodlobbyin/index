import type { Context, MiddlewareHandler } from 'hono';
import { jwtVerify } from 'jose';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';

/**
 * Shape of the authenticated user attached to the Hono context via `c.set('user', ...)`
 */
export interface AuthUser {
  id: number;
  username: string;
  trust_level?: string;
}

/**
 * Backward-compatible request type retained so existing controllers that import
 * `AuthRequest` keep resolving during the incremental migration to Hono.
 */
export interface AuthRequest {
  user?: {
    id: number;
    username: string;
    trust_level: string;
  };
  [key: string]: unknown;
}

/**
 * Hono auth guard. Reads the JWT from the `Authorization: Bearer <token>` header,
 * verifies it with `jose`, and stores the decoded user on the context.
 * Trust level is fetched live from DB so it is always current.
 */
export const authMiddleware: MiddlewareHandler<AppBindings> = async (
  c: Context<AppBindings>,
  next
) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const userId = (payload as { id: number }).id;
    const username = (payload as { username: string }).username;

    // Fetch trust_level live from DB so it is always current
    const db = createDbClient(c.env.DATABASE_URL);
    const row = await db.query(
      'SELECT trust_level FROM users WHERE id = $1',
      [userId]
    );
    const trust_level: string = row.rows[0]?.trust_level ?? 'new';

    c.set('user', { id: userId, username, trust_level });
    await next();
    return;
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// Export as 'authenticate' for consistency across controllers
export const authenticate = authMiddleware;

/**
 * Middleware factory: requires the authenticated user to have at least the given trust level.
 * Trust level hierarchy: new < basic < verified < trusted < moderator < admin
 *
 * Usage: router.use('*', authenticate, requireMinTrustLevel('admin'))
 */
const TRUST_HIERARCHY: Record<string, number> = {
  new: 0,
  basic: 1,
  verified: 2,
  trusted: 3,
  moderator: 4,
  admin: 5,
};

export function requireMinTrustLevel(minLevel: string): MiddlewareHandler<AppBindings> {
  return async (c: Context<AppBindings>, next) => {
    const user = c.get('user') as AuthUser | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userLevel = TRUST_HIERARCHY[user.trust_level ?? 'new'] ?? 0;
    const requiredLevel = TRUST_HIERARCHY[minLevel] ?? 99;

    if (userLevel < requiredLevel) {
      return c.json({ error: 'Forbidden: insufficient permissions.' }, 403);
    }

    await next();
  };
}
