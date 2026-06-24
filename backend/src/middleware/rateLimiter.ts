import type { Context, MiddlewareHandler } from 'hono';
import type { AppBindings } from '../types/env';

/**
 * Resolve the client IP from Cloudflare / proxy headers.
 */
const getClientIp = (c: Context<AppBindings>): string =>
  c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';

/**
 * KV-based fixed-window rate limiter factory.
 * Counts requests per client IP within a 1-minute window using `c.env.RATE_LIMIT_KV`.
 *
 * @param limit Maximum number of requests allowed per minute.
 * @param _windowMinutes Accepted for backward compatibility with the previous
 *   `express-rate-limit` signature; the window is fixed at 1 minute in the KV implementation.
 */
export const createRateLimiter = (
  limit: number,
  _windowMinutes?: number
): MiddlewareHandler<AppBindings> =>
  async (c: Context<AppBindings>, next) => {
    const ip = getClientIp(c);
    const key = `rate:${ip}:${Math.floor(Date.now() / 60000)}`;

    const raw = await c.env.RATE_LIMIT_KV.get(key);
    const count = raw ? parseInt(raw, 10) || 0 : 0;

    if (count >= limit) {
      return c.json({ error: 'Too many requests, please try again later.' }, 429);
    }

    await c.env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 60 });
    await next();
  };

/**
 * General API rate limiter. Uses the configured `RATE_LIMIT_MAX` (default 100) per minute.
 */
export const apiLimiter: MiddlewareHandler<AppBindings> = async (c, next) => {
  const limit = parseInt(c.env.RATE_LIMIT_MAX, 10) || 100;
  return createRateLimiter(limit)(c, next);
};

/**
 * Stricter rate limiter for authentication endpoints (register/login).
 */
export const authRateLimiter = createRateLimiter(5);

/**
 * Rate limiter for OTP endpoints (generation and verification).
 */
export const otpRateLimiter = createRateLimiter(10);

/**
 * Rate limiter for data modification (create) endpoints.
 */
export const createLimiter = createRateLimiter(10);

// Keep legacy export for backward compatibility
export const authLimiter = authRateLimiter;
