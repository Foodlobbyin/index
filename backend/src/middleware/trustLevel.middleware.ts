import type { Context, MiddlewareHandler } from 'hono';
import type { AppBindings } from '../types/env';

export type TrustLevel = 'new' | 'verified' | 'trusted' | 'moderator' | 'admin';

export const TRUST_LEVEL_RANK: Record<TrustLevel, number> = {
  new: 0,
  verified: 1,
  trusted: 2,
  moderator: 3,
  admin: 4,
};

/**
 * Middleware that requires the authenticated user to have at least one of the specified trust levels.
 * Usage: router.get('/path', authMiddleware, requireTrustLevel('moderator', 'admin'), handler)
 */
export const requireTrustLevel = (
  ...levels: TrustLevel[]
): MiddlewareHandler<AppBindings> =>
  async (c: Context<AppBindings>, next) => {
    const rawLevel = c.get('user')?.trust_level;
    const userLevel = rawLevel && rawLevel in TRUST_LEVEL_RANK ? (rawLevel as TrustLevel) : undefined;
    if (!userLevel || !levels.includes(userLevel)) {
      return c.json(
        {
          error: 'Forbidden',
          message: `This action requires trust level: ${levels.join(' or ')}`,
        },
        403
      );
    }
    await next();
  };

/**
 * Middleware that requires the user to have AT LEAST the specified trust level rank (string variant).
 * e.g. requireMinTrustLevel('verified') allows verified, trusted, moderator, admin
 */
export const requireMinTrustLevel = (
  minLevel: TrustLevel
): MiddlewareHandler<AppBindings> =>
  async (c: Context<AppBindings>, next) => {
    const rawLevel = c.get('user')?.trust_level;
    const userLevel = rawLevel && rawLevel in TRUST_LEVEL_RANK ? (rawLevel as TrustLevel) : undefined;
    const userRank = userLevel ? TRUST_LEVEL_RANK[userLevel] : -1;
    const minRank = TRUST_LEVEL_RANK[minLevel];
    if (userRank < minRank) {
      return c.json(
        {
          error: 'Forbidden',
          message: `This action requires at least trust level: ${minLevel}`,
        },
        403
      );
    }
    await next();
  };

/**
 * Middleware factory that requires the user to have AT LEAST the specified numeric trust level.
 * Numeric tiers: 0=new/unverified, 1=verified/basic, 2=trusted, 3=moderator, 4=admin
 * Usage: router.post('/path', authMiddleware, requireMinTrustLevelNumeric(1), handler)
 */
export const requireMinTrustLevelNumeric = (
  minRank: number
): MiddlewareHandler<AppBindings> =>
  async (c: Context<AppBindings>, next) => {
    const rawLevel = c.get('user')?.trust_level;
    const userLevel = rawLevel && rawLevel in TRUST_LEVEL_RANK ? (rawLevel as TrustLevel) : undefined;
    const userRank = userLevel !== undefined ? TRUST_LEVEL_RANK[userLevel] : -1;
    if (userRank < minRank) {
      return c.json(
        {
          error: 'Forbidden',
          message: `This action requires trust level ${minRank} or higher`,
        },
        403
      );
    }
    await next();
  };
