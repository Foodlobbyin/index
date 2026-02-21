import pool from '../config/database';
import { ContactPerson, ContactPersonCreateInput } from '../models/ContactPerson';

export class ContactPersonRepository {
  async create(data: ContactPersonCreateInput): Promise<ContactPerson> {
    const { company_gstn, contact_name, contact_email, contact_phone, designation, is_primary = false } = data;
    const result = await pool.query(
      `INSERT INTO contact_persons (company_gstn, contact_name, contact_email, contact_phone, designation, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [company_gstn, contact_name, contact_email || null, contact_phone || null, designation || null, is_primary]
    );
    return result.rows[0];
  }

  async findByGstn(gstn: string): Promise<ContactPerson[]> {
    const result = await pool.query(
      'SELECT * FROM contact_persons WHERE company_gstn = $1 ORDER BY is_primary DESC, created_at ASC',
      [gstn]
    );
    return result.rows;
  }

  async findById(id: number): Promise<ContactPerson | null> {
    const result = await pool.query('SELECT * FROM contact_persons WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM contact_persons WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export default new ContactPersonRepository();
