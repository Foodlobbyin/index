/**
 * Referral Repository
 * Database operations for referral codes
 */

import type { DbClient } from '../config/database';
import { Referral, ReferralCreateInput } from '../models/Referral';

export class ReferralRepository {
  /**
   * Generate a unique referral code
   */
  private generateReferralCode(): string {
    // Generate a random code: prefix + random string
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const randomStr = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `REF${timestamp}${randomStr}`;
  }

  /**
   * Create a new referral code
   */
  async create(db: DbClient, input: ReferralCreateInput): Promise<Referral> {
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

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Find referral by code
   */
  async findByCode(db: DbClient, code: string): Promise<Referral | null> {
    const query = 'SELECT * FROM referrals WHERE code = $1';
    const result = await db.query(query, [code]);
    return result.rows[0] || null;
  }

  /**
   * Find all referrals created by a user
   */
  async findByCreator(db: DbClient, userId: number): Promise<Referral[]> {
    const query = `
      SELECT * FROM referrals 
      WHERE created_by_user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Increment the used_count of a referral
   * This should be called within a transaction
   */
  async incrementUsedCount(db: DbClient, code: string): Promise<void> {
    const query = `
      UPDATE referrals
      SET used_count = used_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE code = $1
    `;
    await db.query(query, [code]);
  }

  /**
   * Update referral status
   */
  async updateStatus(db: DbClient, id: number, isActive: boolean): Promise<void> {
    const query = `
      UPDATE referrals
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await db.query(query, [isActive, id]);
  }

  /**
   * Get referral usage statistics
   */
  async getUsageStats(db: DbClient, code: string): Promise<{ used_count: number; max_uses: number; remaining: number }> {
    const referral = await this.findByCode(db, code);
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
  async delete(db: DbClient, id: number): Promise<void> {
    await this.updateStatus(db, id, false);
  }
}

export default new ReferralRepository();
