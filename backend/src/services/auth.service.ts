/**
 * AuthService - JWT Token Strategy & Known Limitations
 * -------------------------------------------------------
 * Tokens: JWT (HS256), 7-day expiry, signed with JWT_SECRET (injected).
 *
 * LIMITATIONS:
 *  1. No refresh-token mechanism - once issued, a token is valid for the full
 *     7-day window and cannot be silently renewed without a new login.
 *  2. No server-side token revocation - logging out only removes the token
 *     client-side. A stolen or leaked token remains valid until it expires.
 *  3. No token rotation - all active sessions share the same secret; rotating
 *     JWT_SECRET invalidates ALL existing tokens simultaneously.
 *
 * RECOMMENDED NEXT STEPS:
 *  - Implement a refresh-token pair (short-lived access token ~15 min +
 *    long-lived refresh token ~30 days stored in httpOnly cookie).
 *  - Maintain a token denylist (e.g. Redis set of jti/revoked tokens) to
 *    support immediate logout and forced session invalidation.
 *  - Consider adding jti (JWT ID) claim to each token to enable per-token
 *    revocation without affecting other active sessions.
 *  - Scope tokens with a list of allowed roles/trust_levels at issuance time
 *    so that privilege de-escalation takes effect without waiting for expiry.
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { DbClient } from '../config/database';
import type { Env } from '../types/env';
import userRepository from '../repositories/user.repository';
import emailService from './email.service';
import { UserCreateInputLegacy, UserLoginInput, EmailOTPLoginInput, UserResponse } from '../models/User';

const DEFAULT_FROM_EMAIL = 'noreply@foodlobbyin.com';

const SALT_ROUNDS = 10;

export class AuthService {
  // Generate a random token (WebCrypto)
  private generateToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Generate a 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Sign a JWT with the injected secret
  private async signToken(payload: Record<string, any>, jwtSecret: string): Promise<string> {
    const secret = new TextEncoder().encode(jwtSecret);
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);
  }

  async register(db: DbClient, userData: UserCreateInputLegacy, jwtSecret: string, env: Env): Promise<{ user: UserResponse; token: string; message: string }> {
    // Check if user already exists
    const existingUser = await userRepository.findByUsername(db, userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const existingEmail = await userRepository.findByEmail(db, userData.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    if (userData.mobile_number) {
      const existingMobile = await userRepository.findByMobileNumber(db, userData.mobile_number);
      if (existingMobile) {
        throw new Error('Mobile number already exists');
      }
    }

    // Generate email verification token
    const verificationToken = this.generateToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

    // Hash password if provided
    let password_hash: string | undefined;
    if (userData.password) {
      password_hash = await bcrypt.hash(userData.password, SALT_ROUNDS);
    }

    // Create user
    const user = await userRepository.create(db, {
      username: userData.username,
      mobile_number: userData.mobile_number,
      email: userData.email,
      password_hash,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email_verification_token: verificationToken,
      email_verification_expires: verificationExpires,
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        env.RESEND_API_KEY,
        env.EMAIL_FROM || DEFAULT_FROM_EMAIL,
        env.FRONTEND_URL,
        userData.email,
        verificationToken
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    }

    // Generate JWT token
    const token = await this.signToken({ id: user.id, username: user.username, trust_level: user.trust_level }, jwtSecret);

    return {
      user,
      token,
      message: 'Registration successful! Please check your email to verify your account.'
    };
  }

  async login(db: DbClient, credentials: UserLoginInput, jwtSecret: string): Promise<{ user: UserResponse; token: string }> {
    // Find user
    const user = await userRepository.findByUsername(db, credentials.username);
    if (!user) {
      throw new Error('Invalid credentials');
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
    const token = await this.signToken({ id: user.id, username: user.username, trust_level: user.trust_level }, jwtSecret);

    // Return user without sensitive data
    const { password_hash, email_verification_token, password_reset_token, email_otp, ...userResponse } = user;
    return { user: userResponse as UserResponse, token };
  }

  async verifyEmail(db: DbClient, token: string): Promise<{ message: string }> {
    const user = await userRepository.findByVerificationToken(db, token);
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    await userRepository.verifyEmail(db, user.id);
    return { message: 'Email verified successfully!' };
  }

  async requestPasswordReset(db: DbClient, email: string, env: Env): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(db, email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = this.generateToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

    await userRepository.setPasswordResetToken(db, user.id, resetToken, resetExpires);

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(
        env.RESEND_API_KEY,
        env.EMAIL_FROM || DEFAULT_FROM_EMAIL,
        env.FRONTEND_URL,
        email,
        resetToken
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(db: DbClient, token: string, newPassword: string): Promise<{ message: string }> {
    const user = await userRepository.findByPasswordResetToken(db, token);
    if (!user) {
      throw new Error('Invalid or expired password reset token');
    }

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userRepository.updatePassword(db, user.id, password_hash);

    return { message: 'Password reset successfully! You can now login with your new password.' };
  }

  async requestEmailOTP(db: DbClient, email: string, env: Env): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(db, email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If an account with that email exists, an OTP has been sent.' };
    }

    // Generate OTP
    const otp = this.generateOTP();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes

    await userRepository.setEmailOTP(db, email, otp, otpExpires);

    // Send OTP email
    try {
      await emailService.sendOTPEmail(
        env.RESEND_API_KEY,
        env.EMAIL_FROM || DEFAULT_FROM_EMAIL,
        email,
        otp
      );
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error('Failed to send OTP email');
    }

    return { message: 'If an account with that email exists, an OTP has been sent.' };
  }

  async loginWithEmailOTP(db: DbClient, credentials: EmailOTPLoginInput, jwtSecret: string): Promise<{ user: UserResponse; token: string }> {
    const user = await userRepository.verifyEmailOTP(db, credentials.email, credentials.otp);
    if (!user) {
      throw new Error('Invalid or expired OTP');
    }

    // Clear OTP
    await userRepository.clearEmailOTP(db, user.id);

    // Generate JWT token
    const token = await this.signToken({ id: user.id, username: user.username, trust_level: user.trust_level }, jwtSecret);

    // Return user without sensitive data
    const { password_hash, email_verification_token, password_reset_token, email_otp, ...userResponse } = user;
    return { user: userResponse as UserResponse, token };
  }

  async getUserById(db: DbClient, id: number): Promise<UserResponse> {
    const user = await userRepository.findById(db, id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async verifyToken(token: string, jwtSecret: string): Promise<any> {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default new AuthService();
