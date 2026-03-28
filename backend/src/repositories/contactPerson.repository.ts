import pool from '../config/database';
import { ContactPerson, ContactPersonCreateInput } from '../models/ContactPerson';

export class ContactPersonRepository {
  async create(data: ContactPersonCreateInput): Promise<ContactPerson> {
    const { name, email, phone, company } = data;
    const result = await pool.query(
      `INSERT INTO contact_persons (name, email, phone, company)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, phone ?? null, company ?? null]
    );
    return result.rows[0];
  }

  async findById(id: number): Promise<ContactPerson | null> {
    const result = await pool.query(
      'SELECT * FROM contact_persons WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all contact_persons rows that match the given phone number.
   * Returns every row — a person can be linked to multiple companies.
   */
  async findByPhone(phone: string): Promise<ContactPerson[]> {
    const result = await pool.query(
      `SELECT * FROM contact_persons
       WHERE phone = $1
       ORDER BY created_at ASC`,
      [phone]
    );
    return result.rows;
  }

  /**
   * Return the distinct company names associated with a phone number.
   * Filters out nulls and empty strings.
   */
  async findCompaniesByPhone(phone: string): Promise<string[]> {
    const result = await pool.query(
      `SELECT DISTINCT company
       FROM contact_persons
       WHERE phone = $1
         AND company IS NOT NULL
         AND company <> ''
       ORDER BY company`,
      [phone]
    );
    return result.rows.map((r: { company: string }) => r.company);
  }

  /**
   * @deprecated alias kept for call-sites that still use "mobile" terminology.
   */
  async findCompaniesByMobile(mobile: string): Promise<string[]> {
    return this.findCompaniesByPhone(mobile);
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM contact_persons WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export default new ContactPersonRepository();
