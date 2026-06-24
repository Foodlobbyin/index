/**
 * OTP Service
 * Handles generation, validation, and rate limiting of OTPs
 */

import type { DbClient } from '../config/database';
import type { Env } from '../types/env';
import userRepository from '../repositories/user.repository';
import attemptRepository from '../repositories/attempt.repository';
import emailService from './email.service';

const DEFAULT_FROM_EMAIL = 'noreply@foodlobbyin.com';

const DEFAULT_OTP_EXPIRY_MINUTES = 10;
const DEFAULT_MAX_OTP_GENERATION_PER_HOUR = 5;
const DEFAULT_MAX_OTP_VERIFICATION_ATTEMPTS = 5;

export class OTPService {
  /**
   * Generate a high-entropy 6-digit OTP
   */
  private generateOTP(): string {
    // Use WebCrypto for high-entropy random number generation
    const num = crypto.getRandomValues(new Uint32Array(1))[0];
    const otp = (num % 900000) + 100000; // Ensure 6 digits
    return otp.toString();
  }

  /**
   * Check if user has exceeded OTP generation rate limit
   */
  async checkGenerationRateLimit(
    db: DbClient,
    email: string,
    ip_address?: string,
    maxOtpGenerationPerHour: number = DEFAULT_MAX_OTP_GENERATION_PER_HOUR
  ): Promise<{ allowed: boolean; error?: string }> {
    // Check email-based rate limit
    const emailAttempts = await attemptRepository.getRecentOTPAttempts(db, email, 'generation', 60);

    if (emailAttempts.length >= maxOtpGenerationPerHour) {
      return {
        allowed: false,
        error: `Too many OTP requests. Please try again later.`,
      };
    }

    // Check IP-based rate limit (if IP is provided)
    if (ip_address) {
      const ipAttempts = await attemptRepository.getRecentOTPAttemptsByIP(db, ip_address, 'generation', 60);

      if (ipAttempts.length >= maxOtpGenerationPerHour * 2) {
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
  async checkVerificationRateLimit(
    db: DbClient,
    email: string,
    ip_address?: string,
    maxOtpVerificationAttempts: number = DEFAULT_MAX_OTP_VERIFICATION_ATTEMPTS
  ): Promise<{ allowed: boolean; error?: string }> {
    // Count failed verification attempts
    const failedAttempts = await attemptRepository.countFailedOTPVerifications(db, email, 60);

    if (failedAttempts >= maxOtpVerificationAttempts) {
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
  async generateAndSendOTP(
    db: DbClient,
    env: Env,
    email: string,
    ip_address?: string,
    otpExpiryMinutes: number = DEFAULT_OTP_EXPIRY_MINUTES,
    maxOtpGenerationPerHour: number = DEFAULT_MAX_OTP_GENERATION_PER_HOUR
  ): Promise<{ message: string }> {
    // Check rate limits
    const rateLimitCheck = await this.checkGenerationRateLimit(db, email, ip_address, maxOtpGenerationPerHour);
    if (!rateLimitCheck.allowed) {
      // Log failed attempt
      if (ip_address) {
        await attemptRepository.logOTPAttempt(db, email, ip_address, 'generation', false);
      }
      throw new Error(rateLimitCheck.error);
    }

    // Find user by email
    const user = await userRepository.findByEmail(db, email);
    if (!user) {
      // Log failed attempt (don't reveal if email exists)
      if (ip_address) {
        await attemptRepository.logOTPAttempt(db, email, ip_address, 'generation', false);
      }
      // Return success message anyway for security (don't reveal if email exists)
      return { message: 'If an account with that email exists, an OTP has been sent.' };
    }

    // Generate OTP
    const otp = this.generateOTP();
    const otp_expires = new Date();
    otp_expires.setMinutes(otp_expires.getMinutes() + otpExpiryMinutes);

    // Save OTP to database
    await userRepository.setEmailOTP(db, email, otp, otp_expires);

    // Send OTP email
    try {
      await emailService.sendOTPEmail(
        env.RESEND_API_KEY,
        env.EMAIL_FROM || DEFAULT_FROM_EMAIL,
        email,
        otp
      );

      // Log successful attempt
      if (ip_address) {
        await attemptRepository.logOTPAttempt(db, email, ip_address, 'generation', true);
      }

      return { message: 'OTP has been sent to your email.' };
    } catch (error) {
      console.error('Failed to send OTP email:', error);

      // Log failed attempt
      if (ip_address) {
        await attemptRepository.logOTPAttempt(db, email, ip_address, 'generation', false);
      }

      throw new Error('Failed to send OTP email. Please try again.');
    }
  }

  /**
   * Verify OTP and activate account
   */
  async verifyOTP(
    db: DbClient,
    email: string,
    otp: string,
    ip_address?: string,
    maxOtpVerificationAttempts: number = DEFAULT_MAX_OTP_VERIFICATION_ATTEMPTS
  ): Promise<{ message: string; user_id?: number }> {
    // Check rate limits
    const rateLimitCheck = await this.checkVerificationRateLimit(db, email, ip_address, maxOtpVerificationAttempts);
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.error);
    }

    // Verify OTP
    const user = await userRepository.verifyEmailOTP(db, email, otp);

    if (!user) {
      // Log failed attempt
      if (ip_address) {
        await attemptRepository.logOTPAttempt(db, email, ip_address, 'verification', false);
      }
      throw new Error('Invalid or expired OTP');
    }

    // Clear OTP and activate account
    await userRepository.clearEmailOTP(db, user.id);
    await userRepository.activateAccount(db, user.id);

    // Log successful attempt
    if (ip_address) {
      await attemptRepository.logOTPAttempt(db, email, ip_address, 'verification', true);
    }

    return {
      message: 'Email verified successfully! Your account is now activated.',
      user_id: user.id,
    };
  }

  /**
   * Resend OTP
   */
  async resendOTP(
    db: DbClient,
    env: Env,
    email: string,
    ip_address?: string,
    otpExpiryMinutes: number = DEFAULT_OTP_EXPIRY_MINUTES,
    maxOtpGenerationPerHour: number = DEFAULT_MAX_OTP_GENERATION_PER_HOUR
  ): Promise<{ message: string }> {
    return await this.generateAndSendOTP(db, env, email, ip_address, otpExpiryMinutes, maxOtpGenerationPerHour);
  }
}

export default new OTPService();
