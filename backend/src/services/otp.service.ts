/**
 * OTP Service
 * Handles generation, validation, and rate limiting of OTPs
 */

import crypto from 'crypto';
import userRepository from '../repositories/user.repository';
import attemptRepository from '../repositories/attempt.repository';
import emailService from './email.service';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
const MAX_OTP_GENERATION_PER_HOUR = parseInt(process.env.MAX_OTP_GENERATION_PER_HOUR || '5', 10);
const MAX_OTP_VERIFICATION_ATTEMPTS = parseInt(process.env.MAX_OTP_VERIFICATION_ATTEMPTS || '5', 10);

export class OTPService {
  /**
   * Generate a high-entropy 6-digit OTP
   */
  private generateOTP(): string {
    // Use crypto for high-entropy random number generation
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0);
    const otp = (num % 900000) + 100000; // Ensure 6 digits
    return otp.toString();
  }

  /**
   * Check if user has exceeded OTP generation rate limit
   */
  async checkGenerationRateLimit(email: string, ip_address?: string): Promise<{ allowed: boolean; error?: string }> {
    // Check email-based rate limit
    const emailAttempts = await attemptRepository.getRecentOTPAttempts(email, 'generation', 60);

    if (emailAttempts.length >= MAX_OTP_GENERATION_PER_HOUR) {
      return {
        allowed: false,
        error: `Too many OTP requests. Please try again later.`,
      };
    }

    // Check IP-based rate limit (if IP is provided)
    if (ip_address) {
      const ipAttempts = await attemptRepository.getRecentOTPAttemptsByIP(ip_address, 'generation', 60);

      if (ipAttempts.length >= MAX_OTP_GENERATION_PER_HOUR * 2) {
        // Allow more attempts per IP since multiple users might share the same IP
        return {
          allowed: false,
          error: `Too many OTP requests from this IP address. Please try again later.`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if user has exceeded OTP verification rate limit
   */
  async checkVerificationRateLimit(email: string, ip_address?: string): Promise<{ allowed: boolean; error?: string }> {
    // Count failed verification attempts
    const failedAttempts = await attemptRepository.countFailedOTPVerifications(email, 60);

    if (failedAttempts >= MAX_OTP_VERIFICATION_ATTEMPTS) {
      return {
        allowed: false,
        error: `Too many failed OTP verification attempts. Please request a new OTP.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Generate and send OTP for email verification
   */
  async generateAndSendOTP(email: string, ip_address?: string): Promise<{ message: string }> {
    // Check rate limits
    const rateLimitCheck = await this.checkGenerationRateLimit(email, ip_address);
    if (!rateLimitCheck.allowed) {
      // Log failed attempt
      if (ip_address) {
        await attemptRepository.logOTPAttempt(email, ip_address, 'generation', false);
      }
      throw new Error(rateLimitCheck.error);
    }

    // Find user by email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Log failed attempt (don't reveal if email exists)
      if (ip_address) {
        await attemptRepository.logOTPAttempt(email, ip_address, 'generation', false);
      }
      // Return success message anyway for security (don't reveal if email exists)
      return { message: 'If an account with that email exists, an OTP has been sent.' };
    }

    // Generate OTP
    const otp = this.generateOTP();
    const otp_expires = new Date();
    otp_expires.setMinutes(otp_expires.getMinutes() + OTP_EXPIRY_MINUTES);

    // Save OTP to database
    await userRepository.setEmailOTP(email, otp, otp_expires);

    // Send OTP email
    try {
      await emailService.sendOTPEmail(email, otp);

      // Log successful attempt
      if (ip_address) {
        await attemptRepository.logOTPAttempt(email, ip_address, 'generation', true);
      }

      return { message: 'OTP has been sent to your email.' };
    } catch (error) {
      console.error('Failed to send OTP email:', error);

      // Log failed attempt
      if (ip_address) {
        await attemptRepository.logOTPAttempt(email, ip_address, 'generation', false);
      }

      throw new Error('Failed to send OTP email. Please try again.');
    }
  }

  /**
   * Verify OTP and activate account
   */
  async verifyOTP(email: string, otp: string, ip_address?: string): Promise<{ message: string; user_id?: number }> {
    // Check rate limits
    const rateLimitCheck = await this.checkVerificationRateLimit(email, ip_address);
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.error);
    }

    // Verify OTP
    const user = await userRepository.verifyEmailOTP(email, otp);

    if (!user) {
      // Log failed attempt
      if (ip_address) {
        await attemptRepository.logOTPAttempt(email, ip_address, 'verification', false);
      }
      throw new Error('Invalid or expired OTP');
    }

    // Clear OTP and activate account
    await userRepository.clearEmailOTP(user.id);
    await userRepository.activateAccount(user.id);

    // Log successful attempt
    if (ip_address) {
      await attemptRepository.logOTPAttempt(email, ip_address, 'verification', true);
    }

    return {
      message: 'Email verified successfully! Your account is now activated.',
      user_id: user.id,
    };
  }

  /**
   * Resend OTP
   */
  async resendOTP(email: string, ip_address?: string): Promise<{ message: string }> {
    return await this.generateAndSendOTP(email, ip_address);
  }
}

export default new OTPService();
