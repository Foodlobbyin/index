/**
 * Enhanced Auth Service
 * Secure registration with referral validation, GSTN verification, and OTP-based email verification
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { DbClient } from '../config/database';
import userRepository from '../repositories/user.repository';
import referralRepository from '../repositories/referral.repository';
import attemptRepository from '../repositories/attempt.repository';
import otpService from './otp.service';
import captchaService from './captcha.service';
import referralService from './referral.service';
import validationService from './validation.service';
import { UserCreateInput, UserLoginInput, EmailOTPLoginInput, UserResponse, VerifyOTPInput } from '../models/User';

const SALT_ROUNDS = 12; // Increased from 10 for better security

export class SecureAuthService {
  // Sign a JWT with the injected secret
  private async signToken(payload: Record<string, any>, jwtSecret: string): Promise<string> {
    const secret = new TextEncoder().encode(jwtSecret);
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);
  }

  /**
   * Secure user registration with all validations
   */
  async register(
    db: DbClient,
    userData: UserCreateInput,
    ip_address: string,
    recaptchaSecretKey: string,
    nodeEnv: string,
    user_agent?: string,
    captcha_token?: string
  ): Promise<{ message: string; requiresOTP: boolean }> {
    try {
      // 1. Verify captcha (bot protection)
      if (captchaService.shouldEnforceCaptcha(nodeEnv, recaptchaSecretKey) && captcha_token) {
        const captchaResult = await captchaService.verifyRecaptcha(captcha_token, recaptchaSecretKey, 'register');
        if (!captchaResult.isValid) {
          await attemptRepository.logRegistrationAttempt(
            db,
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
      const referralValidation = await referralService.validateReferralCode(db, userData.referral_code, userData.email);
      if (!referralValidation.isValid) {
        await attemptRepository.logRegistrationAttempt(
          db,
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
        userRepository.findByUsername(db, userData.username),
        userRepository.findByEmail(db, userData.email),
        userRepository.findByPhoneNumber(db, userData.phone_number),
        userData.gstn ? userRepository.findByGSTN(db, userData.gstn) : null,
      ]);

      if (existingUsername) {
        await attemptRepository.logRegistrationAttempt(
          db,
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
          db,
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
          db,
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
          db,
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

      // 6. Create user (account_activated = FALSE)
      // NOTE: Neon HTTP driver has no transactions; run queries sequentially against db.
      const user = await userRepository.createWithClient(db, {
        username: userData.username,
        phone_number: userData.phone_number,
        email: userData.email,
        password_hash,
        first_name: userData.first_name,
        last_name: userData.last_name,
        gstn: userData.gstn,
      });

      // 7. Increment referral used_count
      await referralRepository.incrementUsedCount(db, userData.referral_code);

      // 8. Generate and send OTP for email verification
      try {
        await otpService.generateAndSendOTP(db, userData.email, ip_address);
      } catch (error: any) {
        console.error('Failed to send OTP:', error);
        // Don't fail registration if OTP sending fails
      }

      // 9. Log successful registration attempt
      await attemptRepository.logRegistrationAttempt(
        db,
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
      // Log failed attempt if not already logged
      if (!error.message.includes('already exists') && !error.message.includes('Invalid referral')) {
        await attemptRepository.logRegistrationAttempt(
          db,
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
  async verifyOTP(
    db: DbClient,
    input: VerifyOTPInput,
    jwtSecret: string,
    recaptchaSecretKey: string,
    nodeEnv: string,
    ip_address?: string
  ): Promise<{ message: string; token: string; user: UserResponse }> {
    // Verify captcha if provided
    if (captchaService.shouldEnforceCaptcha(nodeEnv, recaptchaSecretKey) && input.captcha_token) {
      const captchaResult = await captchaService.verifyRecaptcha(input.captcha_token, recaptchaSecretKey, 'verify_otp');
      if (!captchaResult.isValid) {
        throw new Error(captchaResult.error || 'Captcha verification failed');
      }
    }

    // Verify OTP
    const result = await otpService.verifyOTP(db, input.email, input.otp, ip_address);

    // Get user details
    const user = await userRepository.findByEmail(db, input.email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate JWT token
    const token = await this.signToken({ id: user.id, username: user.username }, jwtSecret);

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
  async login(db: DbClient, credentials: UserLoginInput, jwtSecret: string): Promise<{ user: UserResponse; token: string }> {
    // Find user
    const user = await userRepository.findByUsername(db, credentials.username);
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
    const token = await this.signToken({ id: user.id, username: user.username }, jwtSecret);

    // Return user without sensitive data
    const { password_hash, email_verification_token, password_reset_token, email_otp, ...userResponse } = user;
    return { user: userResponse as UserResponse, token };
  }

  /**
   * Request OTP for existing user (resend OTP)
   */
  async requestOTP(
    db: DbClient,
    email: string,
    recaptchaSecretKey: string,
    nodeEnv: string,
    ip_address?: string,
    captcha_token?: string
  ): Promise<{ message: string }> {
    // Verify captcha if provided
    if (captchaService.shouldEnforceCaptcha(nodeEnv, recaptchaSecretKey) && captcha_token) {
      const captchaResult = await captchaService.verifyRecaptcha(captcha_token, recaptchaSecretKey, 'request_otp');
      if (!captchaResult.isValid) {
        throw new Error(captchaResult.error || 'Captcha verification failed');
      }
    }

    return await otpService.generateAndSendOTP(db, email, ip_address);
  }

  /**
   * Get user by ID
   */
  async getUserById(db: DbClient, id: number): Promise<UserResponse> {
    const user = await userRepository.findById(db, id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string, jwtSecret: string): Promise<any> {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default new SecureAuthService();
