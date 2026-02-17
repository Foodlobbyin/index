/**
 * OTP Service Tests
 * Tests for OTP generation, validation, and rate limiting
 */

import otpService from '../../services/otp.service';
import userRepository from '../../repositories/user.repository';
import attemptRepository from '../../repositories/attempt.repository';
import emailService from '../../services/email.service';

// Mock dependencies
jest.mock('../../repositories/user.repository');
jest.mock('../../repositories/attempt.repository');
jest.mock('../../services/email.service');

describe('OTPService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAndSendOTP', () => {
    it('should generate and send OTP for valid email', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      (attemptRepository.getRecentOTPAttempts as jest.Mock).mockResolvedValue([]);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.setEmailOTP as jest.Mock).mockResolvedValue(undefined);
      (emailService.sendOTPEmail as jest.Mock).mockResolvedValue(undefined);
      (attemptRepository.logOTPAttempt as jest.Mock).mockResolvedValue(undefined);

      const result = await otpService.generateAndSendOTP('test@example.com', '127.0.0.1');

      expect(result.message).toContain('OTP has been sent');
      expect(userRepository.setEmailOTP).toHaveBeenCalled();
      expect(emailService.sendOTPEmail).toHaveBeenCalled();
      expect(attemptRepository.logOTPAttempt).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1',
        'generation',
        true
      );
    });

    it('should enforce rate limit on OTP generation', async () => {
      // Mock 5 recent attempts (hitting the limit)
      const recentAttempts = Array(5).fill({ email: 'test@example.com' });
      (attemptRepository.getRecentOTPAttempts as jest.Mock).mockResolvedValue(recentAttempts);

      await expect(
        otpService.generateAndSendOTP('test@example.com', '127.0.0.1')
      ).rejects.toThrow('Too many OTP requests');

      expect(attemptRepository.logOTPAttempt).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1',
        'generation',
        false
      );
    });

    it('should not reveal if email exists for security', async () => {
      (attemptRepository.getRecentOTPAttempts as jest.Mock).mockResolvedValue([]);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await otpService.generateAndSendOTP('nonexistent@example.com', '127.0.0.1');

      expect(result.message).toContain('If an account with that email exists');
      expect(userRepository.setEmailOTP).not.toHaveBeenCalled();
    });

    it('should handle email sending failure gracefully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      (attemptRepository.getRecentOTPAttempts as jest.Mock).mockResolvedValue([]);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.setEmailOTP as jest.Mock).mockResolvedValue(undefined);
      (emailService.sendOTPEmail as jest.Mock).mockRejectedValue(new Error('Email service error'));

      await expect(
        otpService.generateAndSendOTP('test@example.com', '127.0.0.1')
      ).rejects.toThrow('Failed to send OTP email');

      expect(attemptRepository.logOTPAttempt).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1',
        'generation',
        false
      );
    });
  });

  describe('verifyOTP', () => {
    it('should verify valid OTP and activate account', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      (attemptRepository.countFailedOTPVerifications as jest.Mock).mockResolvedValue(0);
      (userRepository.verifyEmailOTP as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.clearEmailOTP as jest.Mock).mockResolvedValue(undefined);
      (userRepository.activateAccount as jest.Mock).mockResolvedValue(undefined);
      (attemptRepository.logOTPAttempt as jest.Mock).mockResolvedValue(undefined);

      const result = await otpService.verifyOTP('test@example.com', '123456', '127.0.0.1');

      expect(result.message).toContain('Email verified successfully');
      expect(result.user_id).toBe(1);
      expect(userRepository.clearEmailOTP).toHaveBeenCalledWith(1);
      expect(userRepository.activateAccount).toHaveBeenCalledWith(1);
      expect(attemptRepository.logOTPAttempt).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1',
        'verification',
        true
      );
    });

    it('should reject invalid OTP', async () => {
      (attemptRepository.countFailedOTPVerifications as jest.Mock).mockResolvedValue(0);
      (userRepository.verifyEmailOTP as jest.Mock).mockResolvedValue(null);

      await expect(
        otpService.verifyOTP('test@example.com', 'wrong-otp', '127.0.0.1')
      ).rejects.toThrow('Invalid or expired OTP');

      expect(attemptRepository.logOTPAttempt).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1',
        'verification',
        false
      );
    });

    it('should enforce rate limit on failed OTP verifications', async () => {
      // Mock 5 failed attempts (hitting the limit)
      (attemptRepository.countFailedOTPVerifications as jest.Mock).mockResolvedValue(5);

      await expect(
        otpService.verifyOTP('test@example.com', '123456', '127.0.0.1')
      ).rejects.toThrow('Too many failed OTP verification attempts');
    });
  });

  describe('checkGenerationRateLimit', () => {
    it('should allow OTP generation within rate limit', async () => {
      (attemptRepository.getRecentOTPAttempts as jest.Mock).mockResolvedValue([{}, {}]); // 2 attempts

      const result = await otpService.checkGenerationRateLimit('test@example.com', '127.0.0.1');

      expect(result.allowed).toBe(true);
    });

    it('should block OTP generation when email rate limit exceeded', async () => {
      const recentAttempts = Array(5).fill({}); // 5 attempts (hitting limit)
      (attemptRepository.getRecentOTPAttempts as jest.Mock).mockResolvedValue(recentAttempts);

      const result = await otpService.checkGenerationRateLimit('test@example.com', '127.0.0.1');

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Too many OTP requests');
    });

    it('should block OTP generation when IP rate limit exceeded', async () => {
      (attemptRepository.getRecentOTPAttempts as jest.Mock).mockResolvedValue([{}]); // 1 email attempt
      (attemptRepository.getRecentOTPAttemptsByIP as jest.Mock).mockResolvedValue(Array(10).fill({})); // 10 IP attempts

      const result = await otpService.checkGenerationRateLimit('test@example.com', '127.0.0.1');

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('IP address');
    });
  });

  describe('checkVerificationRateLimit', () => {
    it('should allow OTP verification within rate limit', async () => {
      (attemptRepository.countFailedOTPVerifications as jest.Mock).mockResolvedValue(2);

      const result = await otpService.checkVerificationRateLimit('test@example.com', '127.0.0.1');

      expect(result.allowed).toBe(true);
    });

    it('should block OTP verification when rate limit exceeded', async () => {
      (attemptRepository.countFailedOTPVerifications as jest.Mock).mockResolvedValue(5);

      const result = await otpService.checkVerificationRateLimit('test@example.com', '127.0.0.1');

      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Too many failed OTP verification attempts');
    });
  });
});
