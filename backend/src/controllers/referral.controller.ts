/**
 * Referral Controller
 * Handles HTTP requests for referral code management
 */

import type { Context } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import referralService from '../services/referral.service';

export class ReferralController {
  /**
   * Create a new referral code
   * POST /api/referrals
   */
  async createReferral(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { max_uses, expires_at, allowed_email_domain } = await c.req.json();

      // Parse expires_at if provided
      let expiresDate: Date | undefined;
      if (expires_at) {
        expiresDate = new Date(expires_at);
        if (isNaN(expiresDate.getTime())) {
          return c.json({ error: 'Invalid expires_at date format' }, 400);
        }
      }

      const referral = await referralService.createReferralCode(db, {
        created_by_user_id: user.id,
        max_uses: max_uses ? parseInt(max_uses, 10) : undefined,
        expires_at: expiresDate,
        allowed_email_domain,
      });

      return c.json({
        message: 'Referral code created successfully',
        referral,
      }, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  /**
   * Get all referrals created by the current user
   * GET /api/referrals/my-referrals
   */
  async getMyReferrals(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const referrals = await referralService.getUserReferrals(db, user.id);

      return c.json({ referrals }, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  /**
   * Get referral usage statistics
   * GET /api/referrals/:code/stats
   */
  async getReferralStats(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const code = c.req.param('code');

      if (!code) {
        return c.json({ error: 'Referral code is required' }, 400);
      }

      const stats = await referralService.getReferralStats(db, code);

      return c.json({ stats }, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  /**
   * Deactivate a referral code
   * PATCH /api/referrals/:referralId/deactivate
   */
  async deactivateReferral(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const referralId = c.req.param('referralId');

      if (!referralId) {
        return c.json({ error: 'Referral ID is required' }, 400);
      }

      const result = await referralService.deactivateReferral(db, parseInt(referralId, 10), user.id);

      return c.json(result, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  /**
   * Activate a referral code
   * PATCH /api/referrals/:referralId/activate
   */
  async activateReferral(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const referralId = c.req.param('referralId');

      if (!referralId) {
        return c.json({ error: 'Referral ID is required' }, 400);
      }

      const result = await referralService.activateReferral(db, parseInt(referralId, 10), user.id);

      return c.json(result, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  /**
   * Validate a referral code (public endpoint for registration form)
   * POST /api/referrals/validate
   */
  async validateReferral(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const { code, email } = await c.req.json();

      if (!code || !email) {
        return c.json({ error: 'Referral code and email are required' }, 400);
      }

      const validation = await referralService.validateReferralCode(db, code, email);

      if (validation.isValid) {
        return c.json({
          valid: true,
          message: 'Referral code is valid',
        }, 200);
      } else {
        return c.json({
          valid: false,
          error: validation.error,
        }, 400);
      }
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
}

export default new ReferralController();
