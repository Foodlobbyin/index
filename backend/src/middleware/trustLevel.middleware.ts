import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

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
export const requireTrustLevel = (...levels: TrustLevel[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    const rawLevel = req.user?.trust_level;
    const userLevel = rawLevel && rawLevel in TRUST_LEVEL_RANK ? (rawLevel as TrustLevel) : undefined;
    if (!userLevel || !levels.includes(userLevel)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `This action requires trust level: ${levels.join(' or ')}`,
      });
      return;
    }
    next();
  };

/**
 * Middleware that requires the user to have AT LEAST the specified trust level rank (string variant).
 * e.g. requireMinTrustLevel('verified') allows verified, trusted, moderator, admin
 */
export const requireMinTrustLevel = (minLevel: TrustLevel) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    const rawLevel = req.user?.trust_level;
    const userLevel = rawLevel && rawLevel in TRUST_LEVEL_RANK ? (rawLevel as TrustLevel) : undefined;
    const userRank = userLevel ? TRUST_LEVEL_RANK[userLevel] : -1;
    const minRank = TRUST_LEVEL_RANK[minLevel];
    if (userRank < minRank) {
      res.status(403).json({
        error: 'Forbidden',
        message: `This action requires at least trust level: ${minLevel}`,
      });
      return;
    }
    next();
  };

/**
 * Middleware factory that requires the user to have AT LEAST the specified numeric trust level.
 * Numeric tiers: 0=new/unverified, 1=verified/basic, 2=trusted, 3=moderator, 4=admin
 * Usage: router.post('/path', authMiddleware, requireMinTrustLevelNumeric(1), handler)
 */
export const requireMinTrustLevelNumeric = (minRank: number) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    const rawLevel = req.user?.trust_level;
    const userLevel = rawLevel && rawLevel in TRUST_LEVEL_RANK ? (rawLevel as TrustLevel) : undefined;
    const userRank = userLevel !== undefined ? TRUST_LEVEL_RANK[userLevel] : -1;
    if (userRank < minRank) {
      res.status(403).json({
        error: 'Forbidden',
        message: `This action requires trust level ${minRank} or higher`,
      });
      return;
    }
    next();
  };
