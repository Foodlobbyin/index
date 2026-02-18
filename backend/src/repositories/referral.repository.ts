/**
 * Referral Repository
 * Database operations for referral codes
 */

import pool from '../config/database';
import { Referral, ReferralCreateInput } from '../models/Referral';
import crypto from 'crypto';

export class ReferralRepository {
  /**
   * Generate a unique referral code
   */
  private generateReferralCode(): string {
    // Generate a random code: prefix + random string
    const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `REF${timestamp}${randomStr}`;
  }

  /**
   * Create a new referral code
   */
  async create(input: ReferralCreateInput): Promise<Referral> {
    const code = this.generateReferralCode();
    const max_uses = input.max_uses || 10;

    const query = `
      INSERT INTO referrals (
        code,
        created_by_user_id,
        max_uses,
        expires_at,
        allowed_email_domain
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      code,
      input.created_by_user_id,
      max_uses,
      input.expires_at || null,
      input.allowed_email_domain || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find referral by code
   */
  async findByCode(code: string): Promise<Referral | null> {
    const query = 'SELECT * FROM referrals WHERE code = $1';
    const result = await pool.query(query, [code]);
    return result.rows[0] || null;
  }

  /**
   * Find all referrals created by a user
   */
  async findByCreator(userId: number): Promise<Referral[]> {
    const query = `
      SELECT * FROM referrals 
      WHERE created_by_user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Increment the used_count of a referral
   * This should be called within a transaction
   */
  async incrementUsedCount(code: string, client?: any): Promise<void> {
    const dbClient = client || pool;
    const query = `
      UPDATE referrals 
      SET used_count = used_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE code = $1
    `;
    await dbClient.query(query, [code]);
  }

  /**
   * Update referral status
   */
  async updateStatus(id: number, isActive: boolean): Promise<void> {
    const query = `
      UPDATE referrals 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await pool.query(query, [isActive, id]);
  }

  /**
   * Get referral usage statistics
   */
  async getUsageStats(code: string): Promise<{ used_count: number; max_uses: number; remaining: number }> {
    const referral = await this.findByCode(code);
    if (!referral) {
      throw new Error('Referral code not found');
    }

    return {
      used_count: referral.used_count,
      max_uses: referral.max_uses,
      remaining: referral.max_uses - referral.used_count,
    };
  }

  /**
   * Delete a referral (soft delete by setting is_active to false)
   */
  async delete(id: number): Promise<void> {
    await this.updateStatus(id, false);
  }
}

export default new ReferralRepository();
