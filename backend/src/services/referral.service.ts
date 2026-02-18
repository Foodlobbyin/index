/**
 * Referral Service
 * Business logic for referral code management and validation
 */

import referralRepository from '../repositories/referral.repository';
import { ReferralCreateInput, ReferralValidationResult } from '../models/Referral';

export class ReferralService {
  /**
   * Create a new referral code
   * Only admins or approved users can create referral codes
   */
  async createReferralCode(input: ReferralCreateInput) {
    // Validate max_uses
    if (input.max_uses && input.max_uses < 1) {
      throw new Error('max_uses must be at least 1');
    }

    // Validate expires_at
    if (input.expires_at && input.expires_at < new Date()) {
      throw new Error('expires_at must be in the future');
    }

    // Validate email domain format
    if (input.allowed_email_domain) {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(input.allowed_email_domain)) {
        throw new Error('Invalid email domain format');
      }
    }

    return await referralRepository.create(input);
  }

  /**
   * Validate a referral code
   * Returns validation result with referral details if valid
   */
  async validateReferralCode(code: string, userEmail: string): Promise<ReferralValidationResult> {
    if (!code) {
      return { isValid: false, error: 'Referral code is required' };
    }

    // Find referral
    const referral = await referralRepository.findByCode(code);

    if (!referral) {
      return { isValid: false, error: 'Invalid referral code' };
    }

    // Check if referral is active
    if (!referral.is_active) {
      return { isValid: false, error: 'Referral code is inactive' };
    }

    // Check if referral has expired
    if (referral.expires_at && new Date(referral.expires_at) < new Date()) {
      return { isValid: false, error: 'Referral code has expired' };
    }

    // Check if referral has reached max uses
    if (referral.used_count >= referral.max_uses) {
      return { isValid: false, error: 'Referral code has reached maximum uses' };
    }

    // Check email domain restriction if specified
    if (referral.allowed_email_domain) {
      const emailDomain = userEmail.split('@')[1]?.toLowerCase();
      const allowedDomain = referral.allowed_email_domain.toLowerCase();

      if (emailDomain !== allowedDomain) {
        return {
          isValid: false,
          error: `Referral code is only valid for ${allowedDomain} email addresses`,
        };
      }
    }

    return { isValid: true, referral };
  }

  /**
   * Get all referral codes created by a user
   */
  async getUserReferrals(userId: number) {
    return await referralRepository.findByCreator(userId);
  }

  /**
   * Get referral usage statistics
   */
  async getReferralStats(code: string) {
    return await referralRepository.getUsageStats(code);
  }

  /**
   * Deactivate a referral code
   */
  async deactivateReferral(referralId: number, userId: number) {
    // In a real application, you'd check if the user owns this referral or is an admin
    await referralRepository.updateStatus(referralId, false);
    return { message: 'Referral code deactivated successfully' };
  }

  /**
   * Activate a referral code
   */
  async activateReferral(referralId: number, userId: number) {
    // In a real application, you'd check if the user owns this referral or is an admin
    await referralRepository.updateStatus(referralId, true);
    return { message: 'Referral code activated successfully' };
  }
}

export default new ReferralService();
