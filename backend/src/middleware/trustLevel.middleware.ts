import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

type TrustLevel = 'new' | 'verified' | 'trusted' | 'moderator' | 'admin';

const TRUST_LEVEL_RANK: Record<TrustLevel, number> = {
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
 * Middleware that requires the user to have AT LEAST the specified trust level rank.
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
