import pool from '../config/database';
import { User, UserCreateInput, UserResponse } from '../models/User';

export interface UserCreateData {
  username: string;
  mobile_number: string;
  email: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  email_verification_token?: string;
  email_verification_expires?: Date;
}

export class UserRepository {
  async create(user: UserCreateData): Promise<UserResponse> {
    const { username, mobile_number, email, password_hash, first_name, last_name, email_verification_token, email_verification_expires } = user;
    const result = await pool.query(
      `INSERT INTO users (username, mobile_number, email, password_hash, first_name, last_name, email_verification_token, email_verification_expires) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, username, mobile_number, email, first_name, last_name, email_verified, created_at`,
      [username, mobile_number, email, password_hash, first_name, last_name, email_verification_token, email_verification_expires]
    );
    return result.rows[0];
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async findByMobileNumber(mobileNumber: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE mobile_number = $1', [mobileNumber]);
    return result.rows[0] || null;
  }

  async findById(id: number): Promise<UserResponse | null> {
    const result = await pool.query(
      'SELECT id, username, mobile_number, email, first_name, last_name, email_verified, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW()',
      [token]
    );
    return result.rows[0] || null;
  }

  async verifyEmail(userId: number): Promise<void> {
    await pool.query(
      'UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL WHERE id = $1',
      [userId]
    );
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );
    return result.rows[0] || null;
  }

  async setPasswordResetToken(userId: number, token: string, expires: Date): Promise<void> {
    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $1',
      [token, expires, userId]
    );
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [passwordHash, userId]
    );
  }

  async setEmailOTP(email: string, otp: string, expires: Date): Promise<void> {
    await pool.query(
      'UPDATE users SET email_otp = $1, email_otp_expires = $2 WHERE email = $3',
      [otp, expires, email]
    );
  }

  async verifyEmailOTP(email: string, otp: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND email_otp = $2 AND email_otp_expires > NOW()',
      [email, otp]
    );
    return result.rows[0] || null;
  }

  async clearEmailOTP(userId: number): Promise<void> {
    await pool.query(
      'UPDATE users SET email_otp = NULL, email_otp_expires = NULL WHERE id = $1',
      [userId]
    );
  }
}

export default new UserRepository();
