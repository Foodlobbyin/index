import type { DbClient } from '../config/database';
import { User, UserCreateInput, UserResponse } from '../models/User';

export interface UserCreateData {
  username: string;
  mobile_number?: string;
  phone_number?: string;
  email: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  gstn?: string;
  email_verification_token?: string;
  email_verification_expires?: Date;
  // Invite system fields
  invite_token_id?: number;
  registration_status?: string;
}

export class UserRepository {
  async create(db: DbClient, user: UserCreateData): Promise<UserResponse> {
    const {
      username, mobile_number, phone_number, email, password_hash,
      first_name, last_name, gstn, email_verification_token,
      email_verification_expires, invite_token_id, registration_status,
    } = user;
    const result = await db.query(
      `INSERT INTO users (
         username, mobile_number, phone_number, email, password_hash,
         first_name, last_name, gstn, email_verification_token,
         email_verification_expires, account_activated,
         invite_token_id, registration_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, $11, $12)
       RETURNING id, username, mobile_number, phone_number, email,
                 first_name, last_name, gstn, email_verified, account_activated,
                 trust_level, registration_status, can_send_invites, created_at`,
      [
        username, mobile_number, phone_number, email, password_hash,
        first_name, last_name, gstn, email_verification_token,
        email_verification_expires,
        invite_token_id ?? null,
        registration_status ?? 'active',
      ]
    );
    return result.rows[0];
  }

  async createWithClient(db: DbClient, user: UserCreateData): Promise<UserResponse> {
    return this.create(db, user);
  }

  async findByUsername(db: DbClient, username: string): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  }

  async findByEmail(db: DbClient, email: string): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async findByMobileNumber(db: DbClient, mobileNumber: string): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE mobile_number = $1', [mobileNumber]);
    return result.rows[0] || null;
  }

  async findById(db: DbClient, id: number): Promise<UserResponse | null> {
    const result = await db.query(
      `SELECT id, username, mobile_number, phone_number, email,
              first_name, last_name, gstn, email_verified, account_activated,
              trust_level, registration_status, can_send_invites, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByVerificationToken(db: DbClient, token: string): Promise<User | null> {
    const result = await db.query(
      'SELECT * FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW()',
      [token]
    );
    return result.rows[0] || null;
  }

  async verifyEmail(db: DbClient, userId: number): Promise<void> {
    await db.query(
      'UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL WHERE id = $1',
      [userId]
    );
  }

  async findByPasswordResetToken(db: DbClient, token: string): Promise<User | null> {
    const result = await db.query(
      'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );
    return result.rows[0] || null;
  }

  async setPasswordResetToken(db: DbClient, userId: number, token: string, expires: Date): Promise<void> {
    await db.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [token, expires, userId]
    );
  }

  async updatePassword(db: DbClient, userId: number, passwordHash: string): Promise<void> {
    await db.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [passwordHash, userId]
    );
  }

  async setEmailOTP(db: DbClient, email: string, otp: string, expires: Date): Promise<void> {
    await db.query(
      'UPDATE users SET email_otp = $1, email_otp_expires = $2 WHERE email = $3',
      [otp, expires, email]
    );
  }

  async verifyEmailOTP(db: DbClient, email: string, otp: string): Promise<User | null> {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND email_otp = $2 AND email_otp_expires > NOW()',
      [email, otp]
    );
    return result.rows[0] || null;
  }

  async clearEmailOTP(db: DbClient, userId: number): Promise<void> {
    await db.query(
      'UPDATE users SET email_otp = NULL, email_otp_expires = NULL WHERE id = $1',
      [userId]
    );
  }

  async findByPhoneNumber(db: DbClient, phoneNumber: string): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);
    return result.rows[0] || null;
  }

  async findByGSTN(db: DbClient, gstn: string): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE gstn = $1', [gstn]);
    return result.rows[0] || null;
  }

  async activateAccount(db: DbClient, userId: number): Promise<void> {
    await db.query(
      'UPDATE users SET account_activated = TRUE, email_verified = TRUE WHERE id = $1',
      [userId]
    );
  }
}

export default new UserRepository();
