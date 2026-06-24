import type { DbClient } from '../config/database';

export interface WaitlistEntry {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  mobile_number: string | null;
  gstn: string | null;
  business_description: string | null;
  status: 'waiting' | 'invited' | 'registered' | 'declined';
  invite_token_id: number | null;
  invited_at: string | null;
  created_at: string;
}

export interface WaitlistCreateData {
  first_name: string;
  last_name?: string;
  email: string;
  mobile_number?: string;
  gstn?: string;
  business_description?: string;
}

export class WaitlistRepository {
  async create(db: DbClient, data: WaitlistCreateData): Promise<WaitlistEntry> {
    const result = await db.query(
      `INSERT INTO waitlist (first_name, last_name, email, mobile_number, gstn, business_description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.first_name,
        data.last_name || null,
        data.email.toLowerCase(),
        data.mobile_number || null,
        data.gstn || null,
        data.business_description || null,
      ]
    );
    return result.rows[0];
  }

  async findByEmail(db: DbClient, email: string): Promise<WaitlistEntry | null> {
    const result = await db.query(
      'SELECT * FROM waitlist WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  }

  async findById(db: DbClient, id: number): Promise<WaitlistEntry | null> {
    const result = await db.query('SELECT * FROM waitlist WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async list(db: DbClient, status?: string): Promise<WaitlistEntry[]> {
    if (status) {
      const result = await db.query(
        'SELECT * FROM waitlist WHERE status = $1 ORDER BY created_at DESC',
        [status]
      );
      return result.rows;
    }
    const result = await db.query('SELECT * FROM waitlist ORDER BY created_at DESC');
    return result.rows;
  }

  async markInvited(db: DbClient, id: number, invite_token_id: number): Promise<void> {
    await db.query(
      `UPDATE waitlist SET status = 'invited', invite_token_id = $1, invited_at = NOW() WHERE id = $2`,
      [invite_token_id, id]
    );
  }

  async markDeclined(db: DbClient, id: number): Promise<void> {
    await db.query(
      `UPDATE waitlist SET status = 'declined' WHERE id = $1`,
      [id]
    );
  }

  async markRegistered(db: DbClient, email: string): Promise<void> {
    await db.query(
      `UPDATE waitlist SET status = 'registered' WHERE email = $1`,
      [email.toLowerCase()]
    );
  }
}

export default new WaitlistRepository();
