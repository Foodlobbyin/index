/**
 * Attempt Repository
 * Database operations for logging registration and OTP attempts
 */

import pool from '../config/database';
import { RegistrationAttempt, OTPAttempt } from '../models/Attempt';

export class AttemptRepository {
  /**
   * Log a registration attempt
   */
  async logRegistrationAttempt(
    email: string,
    phone_number: string | undefined,
    ip_address: string,
    referral_code: string | undefined,
    success: boolean,
    failure_reason?: string,
    user_agent?: string
  ): Promise<void> {
    const query = `
      INSERT INTO registration_attempts (
        email,
        phone_number,
        ip_address,
        referral_code,
        success,
        failure_reason,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const values = [
      email,
      phone_number || null,
      ip_address,
      referral_code || null,
      success,
      failure_reason || null,
      user_agent || null,
    ];

    await pool.query(query, values);
  }

  /**
   * Get recent registration attempts by email
   */
  async getRecentRegistrationAttempts(email: string, minutes: number = 60): Promise<RegistrationAttempt[]> {
    const query = `
      SELECT * FROM registration_attempts
      WHERE email = $1
      AND created_at > NOW() - INTERVAL '${minutes} minutes'
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [email]);
    return result.rows;
  }

  /**
   * Get recent registration attempts by IP
   */
  async getRecentRegistrationAttemptsByIP(ip_address: string, minutes: number = 60): Promise<RegistrationAttempt[]> {
    const query = `
      SELECT * FROM registration_attempts
      WHERE ip_address = $1
      AND created_at > NOW() - INTERVAL '${minutes} minutes'
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [ip_address]);
    return result.rows;
  }

  /**
   * Log an OTP attempt
   */
  async logOTPAttempt(
    email: string,
    ip_address: string | undefined,
    attempt_type: 'generation' | 'verification',
    success: boolean
  ): Promise<void> {
    const query = `
      INSERT INTO otp_attempts (
        email,
        ip_address,
        attempt_type,
        success
      ) VALUES ($1, $2, $3, $4)
    `;

    const values = [email, ip_address || null, attempt_type, success];

    await pool.query(query, values);
  }

  /**
   * Get recent OTP attempts by email
   */
  async getRecentOTPAttempts(
    email: string,
    attempt_type: 'generation' | 'verification',
    minutes: number = 60
  ): Promise<OTPAttempt[]> {
    const query = `
      SELECT * FROM otp_attempts
      WHERE email = $1
      AND attempt_type = $2
      AND created_at > NOW() - INTERVAL '${minutes} minutes'
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [email, attempt_type]);
    return result.rows;
  }

  /**
   * Get recent OTP attempts by IP
   */
  async getRecentOTPAttemptsByIP(
    ip_address: string,
    attempt_type: 'generation' | 'verification',
    minutes: number = 60
  ): Promise<OTPAttempt[]> {
    const query = `
      SELECT * FROM otp_attempts
      WHERE ip_address = $1
      AND attempt_type = $2
      AND created_at > NOW() - INTERVAL '${minutes} minutes'
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [ip_address, attempt_type]);
    return result.rows;
  }

  /**
   * Count failed OTP verification attempts for an email in a time window
   */
  async countFailedOTPVerifications(email: string, minutes: number = 60): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM otp_attempts
      WHERE email = $1
      AND attempt_type = 'verification'
      AND success = false
      AND created_at > NOW() - INTERVAL '${minutes} minutes'
    `;

    const result = await pool.query(query, [email]);
    return parseInt(result.rows[0]?.count || '0', 10);
  }
}

export default new AttemptRepository();
