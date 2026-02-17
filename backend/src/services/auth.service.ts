import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import userRepository from '../repositories/user.repository';
import emailService from './email.service';
import { UserCreateInputLegacy, UserLoginInput, EmailOTPLoginInput, UserResponse } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

export class AuthService {
  // Generate a random token
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate a 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(userData: UserCreateInputLegacy): Promise<{ user: UserResponse; token: string; message: string }> {
    // Check if user already exists
    const existingUser = await userRepository.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const existingEmail = await userRepository.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    if (userData.mobile_number) {
      const existingMobile = await userRepository.findByMobileNumber(userData.mobile_number);
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
    const user = await userRepository.create({
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
      await emailService.sendVerificationEmail(userData.email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return { 
      user, 
      token,
      message: 'Registration successful! Please check your email to verify your account.'
    };
  }

  async login(credentials: UserLoginInput): Promise<{ user: UserResponse; token: string }> {
    // Find user
    const user = await userRepository.findByUsername(credentials.username);
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
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Return user without sensitive data
    const { password_hash, email_verification_token, password_reset_token, email_otp, ...userResponse } = user;
    return { user: userResponse as UserResponse, token };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await userRepository.findByVerificationToken(token);
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    await userRepository.verifyEmail(user.id);
    return { message: 'Email verified successfully!' };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = this.generateToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

    await userRepository.setPasswordResetToken(user.id, resetToken, resetExpires);

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await userRepository.findByPasswordResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired password reset token');
    }

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userRepository.updatePassword(user.id, password_hash);

    return { message: 'Password reset successfully! You can now login with your new password.' };
  }

  async requestEmailOTP(email: string): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If an account with that email exists, an OTP has been sent.' };
    }

    // Generate OTP
    const otp = this.generateOTP();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes

    await userRepository.setEmailOTP(email, otp, otpExpires);

    // Send OTP email
    try {
      await emailService.sendOTPEmail(email, otp);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error('Failed to send OTP email');
    }

    return { message: 'If an account with that email exists, an OTP has been sent.' };
  }

  async loginWithEmailOTP(credentials: EmailOTPLoginInput): Promise<{ user: UserResponse; token: string }> {
    const user = await userRepository.verifyEmailOTP(credentials.email, credentials.otp);
    if (!user) {
      throw new Error('Invalid or expired OTP');
    }

    // Clear OTP
    await userRepository.clearEmailOTP(user.id);

    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Return user without sensitive data
    const { password_hash, email_verification_token, password_reset_token, email_otp, ...userResponse } = user;
    return { user: userResponse as UserResponse, token };
  }

  async getUserById(id: number): Promise<UserResponse> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default new AuthService();
