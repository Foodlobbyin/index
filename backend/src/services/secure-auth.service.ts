/**
 * Enhanced Auth Service
 * Secure registration with referral validation, GSTN verification, and OTP-based email verification
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database';
import userRepository from '../repositories/user.repository';
import referralRepository from '../repositories/referral.repository';
import attemptRepository from '../repositories/attempt.repository';
import emailService from './email.service';
import validationService from './validation.service';
import referralService from './referral.service';
import otpService from './otp.service';
import captchaService from './captcha.service';
import { UserCreateInput, UserLoginInput, EmailOTPLoginInput, UserResponse, VerifyOTPInput } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 12; // Increased from 10 for better security

export class SecureAuthService {
  /**
   * Secure user registration with all validations
   */
  async register(
    userData: UserCreateInput,
    ip_address: string,
    user_agent?: string,
    captcha_token?: string
  ): Promise<{ message: string; requiresOTP: boolean }> {
    const client = await pool.connect();

    try {
      // 1. Verify captcha (bot protection)
      if (captchaService.shouldEnforceCaptcha() && captcha_token) {
        const captchaResult = await captchaService.verifyRecaptcha(captcha_token, 'register');
        if (!captchaResult.isValid) {
          await attemptRepository.logRegistrationAttempt(
            userData.email,
            userData.phone_number,
            ip_address,
            userData.referral_code,
            false,
            `Captcha verification failed: ${captchaResult.error}`,
            user_agent
          );
          throw new Error(captchaResult.error || 'Captcha verification failed');
        }
      }

      // 2. Validate all fields
      await this.validateRegistrationData(userData);

      // 3. Validate referral code (required)
      const referralValidation = await referralService.validateReferralCode(userData.referral_code, userData.email);
      if (!referralValidation.isValid) {
        await attemptRepository.logRegistrationAttempt(
          userData.email,
          userData.phone_number,
          ip_address,
          userData.referral_code,
          false,
          `Invalid referral: ${referralValidation.error}`,
          user_agent
        );
        throw new Error(referralValidation.error);
      }

      // 4. Check for existing users
      const [existingUsername, existingEmail, existingPhone, existingGSTN] = await Promise.all([
        userRepository.findByUsername(userData.username),
        userRepository.findByEmail(userData.email),
        userRepository.findByPhoneNumber(userData.phone_number),
        userData.gstn ? userRepository.findByGSTN(userData.gstn) : null,
      ]);

      if (existingUsername) {
        await attemptRepository.logRegistrationAttempt(
          userData.email,
          userData.phone_number,
          ip_address,
          userData.referral_code,
          false,
          'Username already exists',
          user_agent
        );
        throw new Error('Username already exists');
      }

      if (existingEmail) {
        await attemptRepository.logRegistrationAttempt(
          userData.email,
          userData.phone_number,
          ip_address,
          userData.referral_code,
          false,
          'Email already exists',
          user_agent
        );
        throw new Error('Email already exists');
      }

      if (existingPhone) {
        await attemptRepository.logRegistrationAttempt(
          userData.email,
          userData.phone_number,
          ip_address,
          userData.referral_code,
          false,
          'Phone number already exists',
          user_agent
        );
        throw new Error('Phone number already exists');
      }

      if (existingGSTN) {
        await attemptRepository.logRegistrationAttempt(
          userData.email,
          userData.phone_number,
          ip_address,
          userData.referral_code,
          false,
          'GSTN already exists',
          user_agent
        );
        throw new Error('GSTN already registered');
      }

      // 5. Hash password
      const password_hash = await bcrypt.hash(userData.password, SALT_ROUNDS);

      // 6. Start database transaction
      await client.query('BEGIN');

      // 7. Create user (account_activated = FALSE)
      const user = await userRepository.createWithClient(
        {
          username: userData.username,
          phone_number: userData.phone_number,
          email: userData.email,
          password_hash,
          first_name: userData.first_name,
          last_name: userData.last_name,
          gstn: userData.gstn,
        },
        client
      );

      // 8. Increment referral used_count
      await referralRepository.incrementUsedCount(userData.referral_code, client);

      // 9. Commit transaction
      await client.query('COMMIT');

      // 10. Generate and send OTP for email verification
      try {
        await otpService.generateAndSendOTP(userData.email, ip_address);
      } catch (error: any) {
        console.error('Failed to send OTP:', error);
        // Don't fail registration if OTP sending fails
      }

      // 11. Log successful registration attempt
      await attemptRepository.logRegistrationAttempt(
        userData.email,
        userData.phone_number,
        ip_address,
        userData.referral_code,
        true,
        undefined,
        user_agent
      );

      return {
        message: 'Registration successful! Please verify your email with the OTP sent to activate your account.',
        requiresOTP: true,
      };
    } catch (error: any) {
      // Rollback transaction on error
      await client.query('ROLLBACK');

      // Log failed attempt if not already logged
      if (!error.message.includes('already exists') && !error.message.includes('Invalid referral')) {
        await attemptRepository.logRegistrationAttempt(
          userData.email,
          userData.phone_number,
          ip_address,
          userData.referral_code,
          false,
          error.message,
          user_agent
        );
      }

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate all registration data
   */
  private async validateRegistrationData(userData: UserCreateInput): Promise<void> {
    // Validate name (use first_name or username)
    if (userData.first_name) {
      const nameValidation = validationService.validateName(userData.first_name, 'First name');
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.error);
      }
    }

    if (userData.last_name) {
      const lastNameValidation = validationService.validateName(userData.last_name, 'Last name');
      if (!lastNameValidation.isValid) {
        throw new Error(lastNameValidation.error);
      }
    }

    // Validate email
    const emailValidation = validationService.validateEmail(userData.email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }

    // Validate phone number
    const phoneValidation = validationService.validatePhoneNumber(userData.phone_number);
    if (!phoneValidation.isValid) {
      throw new Error(phoneValidation.error);
    }

    // Validate GSTN
    const gstnValidation = validationService.validateGSTN(userData.gstn);
    if (!gstnValidation.isValid) {
      throw new Error(gstnValidation.error);
    }

    // Validate password
    const passwordValidation = validationService.validatePassword(userData.password, userData.confirm_password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error);
    }
  }

  /**
   * Verify OTP and activate account
   */
  async verifyOTP(input: VerifyOTPInput, ip_address?: string): Promise<{ message: string; token: string; user: UserResponse }> {
    // Verify captcha if provided
    if (captchaService.shouldEnforceCaptcha() && input.captcha_token) {
      const captchaResult = await captchaService.verifyRecaptcha(input.captcha_token, 'verify_otp');
      if (!captchaResult.isValid) {
        throw new Error(captchaResult.error || 'Captcha verification failed');
      }
    }

    // Verify OTP
    const result = await otpService.verifyOTP(input.email, input.otp, ip_address);

    // Get user details
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Return user without sensitive data
    const { password_hash, email_verification_token, password_reset_token, email_otp, ...userResponse } = user;

    return {
      message: result.message,
      token,
      user: userResponse as UserResponse,
    };
  }

  /**
   * Login with username and password
   */
  async login(credentials: UserLoginInput): Promise<{ user: UserResponse; token: string }> {
    // Find user
    const user = await userRepository.findByUsername(credentials.username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is activated
    if (!user.account_activated) {
      throw new Error('Account not activated. Please verify your email with the OTP sent during registration.');
    }

    // Check if user has a password set
    if (!user.password_hash) {
      throw new Error('Please use Email OTP to login. No password set for this account.');
    }

    // Verify password
    const isValid = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Return user without sensitive data
    const { password_hash, email_verification_token, password_reset_token, email_otp, ...userResponse } = user;
    return { user: userResponse as UserResponse, token };
  }

  /**
   * Request OTP for existing user (resend OTP)
   */
  async requestOTP(email: string, ip_address?: string, captcha_token?: string): Promise<{ message: string }> {
    // Verify captcha if provided
    if (captchaService.shouldEnforceCaptcha() && captcha_token) {
      const captchaResult = await captchaService.verifyRecaptcha(captcha_token, 'request_otp');
      if (!captchaResult.isValid) {
        throw new Error(captchaResult.error || 'Captcha verification failed');
      }
    }

    return await otpService.generateAndSendOTP(email, ip_address);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<UserResponse> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default new SecureAuthService();
