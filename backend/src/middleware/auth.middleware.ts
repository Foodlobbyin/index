import type { Context, MiddlewareHandler } from 'hono';
import { jwtVerify } from 'jose';
import type { AppBindings } from '../types/env';

/**
 * Shape of the authenticated user attached to the Hono context via `c.set('user', ...)`.
 */
export interface AuthUser {
  id: number;
  username: string;
  trust_level?: string;
}

/**
 * Backward-compatible request type retained so existing controllers that import
 * `AuthRequest` keep resolving during the incremental migration to Hono. The original
 * Express-based definition extended `Request`; it is modelled here without depending on
 * Express types (which are not part of the Workers build).
 */
export interface AuthRequest {
  user?: {
    id: number;
    username: string;
    trust_level: string;
  };
  // Permissive index signature preserves the broad shape of the former `extends Request`.
  [key: string]: unknown;
}

/**
 * Hono auth guard. Reads the JWT from the `Authorization: Bearer <token>` header,
 * verifies it with `jose`, and stores the decoded user on the context.
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
    c.set('user', {
      id: (payload as { id: number }).id,
      username: (payload as { username: string }).username,
      trust_level: (payload as { trust_level?: string }).trust_level,
    });
    await next();
    return;
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// Export as 'authenticate' for consistency
export const authenticate = authMiddleware;
