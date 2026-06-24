import type { DbClient } from '../config/database';
import crypto from 'crypto';

export interface InviteToken {
  id: number;
  token: string;
  type: 'marketing' | 'member';
  invited_email: string;
  invited_by_user_id: number | null;
  status: 'pending' | 'used' | 'expired' | 'revoked';
  expires_at: string;
  used_at: string | null;
  used_by_user_id: number | null;
  created_at: string;
}

export class InviteTokenRepository {
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async create(
    db: DbClient,
    data: {
      type: 'marketing' | 'member';
      invited_email: string;
      invited_by_user_id?: number | null;
    }
  ): Promise<InviteToken> {
    const token = this.generateToken();
    const result = await db.query(
      `INSERT INTO invite_tokens (token, type, invited_email, invited_by_user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [token, data.type, data.invited_email.toLowerCase(), data.invited_by_user_id || null]
    );
    return result.rows[0];
  }

  async findByToken(db: DbClient, token: string): Promise<InviteToken | null> {
    const result = await db.query(
      'SELECT * FROM invite_tokens WHERE token = $1',
      [token]
    );
    return result.rows[0] || null;
  }

  async validateToken(
    db: DbClient,
    token: string
  ): Promise<{ valid: boolean; invite?: InviteToken; error?: string }> {
    const invite = await this.findByToken(db, token);
    if (!invite) return { valid: false, error: 'Invalid invite link.' };
    if (invite.status === 'used') return { valid: false, error: 'This invite link has already been used.' };
    if (invite.status === 'revoked') return { valid: false, error: 'This invite link has been revoked.' };
    if (invite.status === 'expired' || new Date(invite.expires_at) < new Date()) {
      await this.markExpired(db, invite.id);
      return { valid: false, error: 'This invite link has expired. Please request a new one.' };
    }
    return { valid: true, invite };
  }

  async markUsed(db: DbClient, id: number, used_by_user_id: number | null): Promise<void> {
    await db.query(
      `UPDATE invite_tokens SET status = 'used', used_at = NOW(), used_by_user_id = $1 WHERE id = $2`,
      [used_by_user_id, id]
    );
  }

  async markExpired(db: DbClient, id: number): Promise<void> {
    await db.query(
      `UPDATE invite_tokens SET status = 'expired' WHERE id = $1`,
      [id]
    );
  }

  async revoke(db: DbClient, id: number): Promise<void> {
    await db.query(
      `UPDATE invite_tokens SET status = 'revoked' WHERE id = $1`,
      [id]
    );
  }

  async listByUser(db: DbClient, user_id: number): Promise<InviteToken[]> {
    const result = await db.query(
      'SELECT * FROM invite_tokens WHERE invited_by_user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    return result.rows;
  }

  // Expire all tokens past their expiry date
  async expireStale(db: DbClient): Promise<void> {
    await db.query(
      `UPDATE invite_tokens SET status = 'expired'
       WHERE status = 'pending' AND expires_at < NOW()`
    );
  }
}

export default new InviteTokenRepository();
