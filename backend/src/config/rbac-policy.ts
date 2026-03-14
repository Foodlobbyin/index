/**
 * Central RBAC Policy Table
 *
 * Trust levels (5-tier):
 *   new(0)       – registered but email not yet verified
 *   verified(1)  – email verified
 *   trusted(2)   – manually elevated trusted member
 *   moderator(3) – content moderation privileges
 *   admin(4)     – full administrative access
 *
 * Legend:
 *   requiredLevel: minimum trust level required to call the endpoint.
 *   'public' means no authentication is required at all.
 *   middleware: the Express middleware chain applied on the route.
 */

export type TrustLevelName = 'public' | 'new' | 'verified' | 'trusted' | 'moderator' | 'admin';

export interface RBACPolicyEntry {
  method: string;
  path: string;
  requiredLevel: TrustLevelName;
  middleware: string;
}

export const RBAC_POLICY: RBACPolicyEntry[] = [
  // ---------------------------------------------------------------------------
  // Health
  // ---------------------------------------------------------------------------
  {
    method: 'GET',
    path: '/api/health/db',
    requiredLevel: 'public',
    middleware: 'none',
  },

  // ---------------------------------------------------------------------------
  // Auth (legacy) – /api/auth
  // ---------------------------------------------------------------------------
  {
    method: 'POST',
    path: '/api/auth/register',
    requiredLevel: 'public',
    middleware: 'authLimiter + validate(registerSchema)',
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    requiredLevel: 'public',
    middleware: 'authLimiter + validate(loginSchema)',
  },
  {
    method: 'GET',
    path: '/api/auth/verify-email',
    requiredLevel: 'public',
    middleware: 'none',
  },
  {
    method: 'POST',
    path: '/api/auth/request-password-reset',
    requiredLevel: 'public',
    middleware: 'authLimiter + validate(forgotPasswordSchema)',
  },
  {
    method: 'POST',
    path: '/api/auth/reset-password',
    requiredLevel: 'public',
    middleware: 'authLimiter + validate(resetPasswordSchema)',
  },
  {
    method: 'POST',
    path: '/api/auth/request-email-otp',
    requiredLevel: 'public',
    middleware: 'authLimiter + validate(requestEmailOTPSchema)',
  },
  {
    method: 'POST',
    path: '/api/auth/login-with-otp',
    requiredLevel: 'public',
    middleware: 'authLimiter + validate(loginWithOTPSchema)',
  },
  {
    method: 'GET',
    path: '/api/auth/profile',
    requiredLevel: 'new',
    middleware: 'authMiddleware',
  },

  // ---------------------------------------------------------------------------
  // Secure Auth (enhanced) – /api/secure-auth
  // ---------------------------------------------------------------------------
  {
    method: 'POST',
    path: '/api/secure-auth/register',
    requiredLevel: 'public',
    middleware: 'none',
  },
  {
    method: 'POST',
    path: '/api/secure-auth/verify-otp',
    requiredLevel: 'public',
    middleware: 'validate(loginWithOTPSchema)',
  },
  {
    method: 'POST',
    path: '/api/secure-auth/request-otp',
    requiredLevel: 'public',
    middleware: 'validate(requestEmailOTPSchema)',
  },
  {
    method: 'POST',
    path: '/api/secure-auth/login',
    requiredLevel: 'public',
    middleware: 'validate(loginSchema)',
  },
  {
    method: 'GET',
    path: '/api/secure-auth/profile',
    requiredLevel: 'new',
    middleware: 'authenticate',
  },

  // ---------------------------------------------------------------------------
  // Company – /api/company
  // ---------------------------------------------------------------------------
  {
    method: 'POST',
    path: '/api/company',
    requiredLevel: 'new',
    middleware: 'authMiddleware',
  },
  {
    method: 'GET',
    path: '/api/company',
    requiredLevel: 'new',
    middleware: 'authMiddleware',
  },
  {
    method: 'PUT',
    path: '/api/company/:id',
    requiredLevel: 'new',
    middleware: 'authMiddleware',
  },
  {
    method: 'DELETE',
    path: '/api/company/:id',
    requiredLevel: 'new',
    middleware: 'authMiddleware',
  },

  // ---------------------------------------------------------------------------
  // Referrals – /api/referrals
  // ---------------------------------------------------------------------------
  {
    method: 'POST',
    path: '/api/referrals/validate',
    requiredLevel: 'public',
    middleware: 'none',
  },
  {
    method: 'POST',
    path: '/api/referrals',
    requiredLevel: 'new',
    middleware: 'authenticate',
  },
  {
    method: 'GET',
    path: '/api/referrals/my-referrals',
    requiredLevel: 'new',
    middleware: 'authenticate',
  },
  {
    method: 'GET',
    path: '/api/referrals/:code/stats',
    requiredLevel: 'new',
    middleware: 'authenticate',
  },
  {
    method: 'PATCH',
    path: '/api/referrals/:referralId/deactivate',
    requiredLevel: 'new',
    middleware: 'authenticate',
  },
  {
    method: 'PATCH',
    path: '/api/referrals/:referralId/activate',
    requiredLevel: 'new',
    middleware: 'authenticate',
  },

  // ---------------------------------------------------------------------------
  // Incidents – /api/incidents
  // ---------------------------------------------------------------------------
  {
    method: 'GET',
    path: '/api/incidents/search',
    requiredLevel: 'public',
    middleware: 'apiLimiter',
  },
  {
    method: 'POST',
    path: '/api/incidents/submit',
    requiredLevel: 'verified',
    middleware: 'apiLimiter + authMiddleware + requireMinTrustLevel(verified) + createLimiter',
  },
  {
    method: 'GET',
    path: '/api/incidents/my-reports',
    requiredLevel: 'new',
    middleware: 'apiLimiter + authMiddleware',
  },
  {
    method: 'GET',
    path: '/api/incidents/company/:gstn',
    requiredLevel: 'new',
    middleware: 'apiLimiter + authMiddleware',
  },
  {
    method: 'GET',
    path: '/api/incidents/:id',
    requiredLevel: 'public',
    middleware: 'apiLimiter',
  },
  {
    method: 'PUT',
    path: '/api/incidents/:id',
    requiredLevel: 'new',
    middleware: 'apiLimiter + authMiddleware',
  },
  {
    method: 'DELETE',
    path: '/api/incidents/:id',
    requiredLevel: 'admin',
    middleware: 'apiLimiter + authMiddleware + requireMinTrustLevel(admin)',
  },
  {
    method: 'POST',
    path: '/api/incidents/:id/evidence',
    requiredLevel: 'new',
    middleware: 'apiLimiter + authMiddleware + uploadMiddleware',
  },
  {
    method: 'GET',
    path: '/api/incidents/:id/evidence/:evidenceId',
    requiredLevel: 'public',
    middleware: 'apiLimiter',
  },
  {
    method: 'POST',
    path: '/api/incidents/:id/respond',
    requiredLevel: 'new',
    middleware: 'apiLimiter + authMiddleware',
  },

  // ---------------------------------------------------------------------------
  // Invoices – /api/invoices
  // ---------------------------------------------------------------------------
  {
    method: 'POST',
    path: '/api/invoices',
    requiredLevel: 'new',
    middleware: 'authMiddleware',
  },
  {
    method: 'GET',
    path: '/api/invoices',
    requiredLevel: 'new',
    middleware: 'authMiddleware',
  },
  {
    method: 'GET',
    path: '/api/invoices/:id',
    requiredLevel: 'new',
    middleware: 'authMiddleware',
  },
  {
    method: 'PUT',
    path: '/api/invoices/:id',
    requiredLevel: 'new',
    middleware: 'authMiddleware',
  },
  {
    method: 'DELETE',
    path: '/api/invoices/:id',
    requiredLevel: 'new',
    middleware: 'authMiddleware',
  },

  // ---------------------------------------------------------------------------
  // Moderation – /api/moderation
  // ---------------------------------------------------------------------------
  {
    method: 'GET',
    path: '/api/moderation/queue',
    requiredLevel: 'moderator',
    middleware: 'apiLimiter + authMiddleware + requireMinTrustLevel(moderator)',
  },
  {
    method: 'PUT',
    path: '/api/moderation/incidents/:id/approve',
    requiredLevel: 'moderator',
    middleware: 'apiLimiter + authMiddleware + requireMinTrustLevel(moderator)',
  },
  {
    method: 'PUT',
    path: '/api/moderation/incidents/:id/reject',
    requiredLevel: 'moderator',
    middleware: 'apiLimiter + authMiddleware + requireMinTrustLevel(moderator)',
  },
  {
    method: 'POST',
    path: '/api/moderation/incidents/:id/penalty',
    requiredLevel: 'moderator',
    middleware: 'apiLimiter + authMiddleware + requireMinTrustLevel(moderator)',
  },

  // ---------------------------------------------------------------------------
  // Audit Logs – /api/audit-logs
  // ---------------------------------------------------------------------------
  {
    method: 'GET',
    path: '/api/audit-logs',
    requiredLevel: 'moderator',
    middleware: 'apiLimiter + authMiddleware + requireTrustLevel(moderator, admin)',
  },
  {
    method: 'GET',
    path: '/api/audit-logs/incident/:incidentId',
    requiredLevel: 'moderator',
    middleware: 'apiLimiter + authMiddleware + requireTrustLevel(moderator, admin)',
  },

  // ---------------------------------------------------------------------------
  // Insights – /api/insights
  // ---------------------------------------------------------------------------
  {
    method: 'GET',
    path: '/api/insights',
    requiredLevel: 'public',
    middleware: 'none',
  },

  // ---------------------------------------------------------------------------
  // Reputation – /api/reputation
  // ---------------------------------------------------------------------------
  {
    method: 'GET',
    path: '/api/reputation/:gstn',
    requiredLevel: 'public',
    middleware: 'apiLimiter',
  },
  {
    method: 'POST',
    path: '/api/reputation/:gstn/recalculate',
    requiredLevel: 'new',
    middleware: 'apiLimiter + authMiddleware',
  },
];
