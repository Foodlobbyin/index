/**
 * Referral Service Tests
 * Tests for referral code creation and validation
 */

import referralService from '../../services/referral.service';
import referralRepository from '../../repositories/referral.repository';

// Mock the referral repository
jest.mock('../../repositories/referral.repository');

describe('ReferralService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReferralCode', () => {
    it('should create a referral code with default max_uses', async () => {
      const mockReferral = {
        id: 1,
        code: 'REF123ABC',
        created_by_user_id: 1,
        max_uses: 10,
        used_count: 0,
        expires_at: undefined,
        allowed_email_domain: undefined,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (referralRepository.create as jest.Mock).mockResolvedValue(mockReferral);

      const result = await referralService.createReferralCode({
        created_by_user_id: 1,
      });

      expect(result).toEqual(mockReferral);
      expect(referralRepository.create).toHaveBeenCalledWith({
        created_by_user_id: 1,
      });
    });

    it('should reject max_uses less than 1', async () => {
      await expect(
        referralService.createReferralCode({
          created_by_user_id: 1,
          max_uses: 0,
        })
      ).rejects.toThrow('max_uses must be at least 1');
    });

    it('should reject expires_at in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await expect(
        referralService.createReferralCode({
          created_by_user_id: 1,
          expires_at: pastDate,
        })
      ).rejects.toThrow('expires_at must be in the future');
    });

    it('should reject invalid email domain format', async () => {
      await expect(
        referralService.createReferralCode({
          created_by_user_id: 1,
          allowed_email_domain: 'invalid domain',
        })
      ).rejects.toThrow('Invalid email domain format');
    });

    it('should accept valid email domain', async () => {
      const mockReferral = {
        id: 1,
        code: 'REF123ABC',
        created_by_user_id: 1,
        max_uses: 10,
        used_count: 0,
        expires_at: undefined,
        allowed_email_domain: 'company.com',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (referralRepository.create as jest.Mock).mockResolvedValue(mockReferral);

      const result = await referralService.createReferralCode({
        created_by_user_id: 1,
        allowed_email_domain: 'company.com',
      });

      expect(result.allowed_email_domain).toBe('company.com');
    });
  });

  describe('validateReferralCode', () => {
    it('should validate a valid referral code', async () => {
      const mockReferral = {
        id: 1,
        code: 'VALIDREF',
        created_by_user_id: 1,
        max_uses: 10,
        used_count: 5,
        expires_at: undefined,
        allowed_email_domain: undefined,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (referralRepository.findByCode as jest.Mock).mockResolvedValue(mockReferral);

      const result = await referralService.validateReferralCode('VALIDREF', 'user@example.com');

      expect(result.isValid).toBe(true);
      expect(result.referral).toEqual(mockReferral);
    });

    it('should reject empty referral code', async () => {
      const result = await referralService.validateReferralCode('', 'user@example.com');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Referral code is required');
    });

    it('should reject non-existent referral code', async () => {
      (referralRepository.findByCode as jest.Mock).mockResolvedValue(null);

      const result = await referralService.validateReferralCode('INVALID', 'user@example.com');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid referral code');
    });

    it('should reject inactive referral code', async () => {
      const mockReferral = {
        id: 1,
        code: 'INACTIVE',
        created_by_user_id: 1,
        max_uses: 10,
        used_count: 5,
        expires_at: undefined,
        allowed_email_domain: undefined,
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (referralRepository.findByCode as jest.Mock).mockResolvedValue(mockReferral);

      const result = await referralService.validateReferralCode('INACTIVE', 'user@example.com');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Referral code is inactive');
    });

    it('should reject expired referral code', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      const mockReferral = {
        id: 1,
        code: 'EXPIRED',
        created_by_user_id: 1,
        max_uses: 10,
        used_count: 5,
        expires_at: expiredDate,
        allowed_email_domain: undefined,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (referralRepository.findByCode as jest.Mock).mockResolvedValue(mockReferral);

      const result = await referralService.validateReferralCode('EXPIRED', 'user@example.com');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Referral code has expired');
    });

    it('should reject referral code that reached max uses', async () => {
      const mockReferral = {
        id: 1,
        code: 'MAXED',
        created_by_user_id: 1,
        max_uses: 10,
        used_count: 10,
        expires_at: undefined,
        allowed_email_domain: undefined,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (referralRepository.findByCode as jest.Mock).mockResolvedValue(mockReferral);

      const result = await referralService.validateReferralCode('MAXED', 'user@example.com');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Referral code has reached maximum uses');
    });

    it('should check email domain restriction', async () => {
      const mockReferral = {
        id: 1,
        code: 'RESTRICTED',
        created_by_user_id: 1,
        max_uses: 10,
        used_count: 5,
        expires_at: undefined,
        allowed_email_domain: 'company.com',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (referralRepository.findByCode as jest.Mock).mockResolvedValue(mockReferral);

      // Test with matching domain
      let result = await referralService.validateReferralCode('RESTRICTED', 'user@company.com');
      expect(result.isValid).toBe(true);

      // Test with non-matching domain
      result = await referralService.validateReferralCode('RESTRICTED', 'user@other.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('only valid for company.com');
    });
  });
});
