/**
 * Referral Controller
 * Handles HTTP requests for referral code management
 */

import { Response } from 'express';
import referralService from '../services/referral.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class ReferralController {
  /**
   * Create a new referral code
   * POST /api/referrals
   */
  async createReferral(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { max_uses, expires_at, allowed_email_domain } = req.body;

      // Parse expires_at if provided
      let expiresDate: Date | undefined;
      if (expires_at) {
        expiresDate = new Date(expires_at);
        if (isNaN(expiresDate.getTime())) {
          res.status(400).json({ error: 'Invalid expires_at date format' });
          return;
        }
      }

      const referral = await referralService.createReferralCode({
        created_by_user_id: req.user.id,
        max_uses: max_uses ? parseInt(max_uses, 10) : undefined,
        expires_at: expiresDate,
        allowed_email_domain,
      });

      res.status(201).json({
        message: 'Referral code created successfully',
        referral,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get all referrals created by the current user
   * GET /api/referrals/my-referrals
   */
  async getMyReferrals(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const referrals = await referralService.getUserReferrals(req.user.id);

      res.status(200).json({ referrals });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get referral usage statistics
   * GET /api/referrals/:code/stats
   */
  async getReferralStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      if (!code) {
        res.status(400).json({ error: 'Referral code is required' });
        return;
      }

      const stats = await referralService.getReferralStats(code);

      res.status(200).json({ stats });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Deactivate a referral code
   * PATCH /api/referrals/:referralId/deactivate
   */
  async deactivateReferral(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { referralId } = req.params;

      if (!referralId) {
        res.status(400).json({ error: 'Referral ID is required' });
        return;
      }

      const result = await referralService.deactivateReferral(parseInt(referralId, 10), req.user.id);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Activate a referral code
   * PATCH /api/referrals/:referralId/activate
   */
  async activateReferral(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { referralId } = req.params;

      if (!referralId) {
        res.status(400).json({ error: 'Referral ID is required' });
        return;
      }

      const result = await referralService.activateReferral(parseInt(referralId, 10), req.user.id);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Validate a referral code (public endpoint for registration form)
   * POST /api/referrals/validate
   */
  async validateReferral(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code, email } = req.body;

      if (!code || !email) {
        res.status(400).json({ error: 'Referral code and email are required' });
        return;
      }

      const validation = await referralService.validateReferralCode(code, email);

      if (validation.isValid) {
        res.status(200).json({
          valid: true,
          message: 'Referral code is valid',
        });
      } else {
        res.status(400).json({
          valid: false,
          error: validation.error,
        });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new ReferralController();
