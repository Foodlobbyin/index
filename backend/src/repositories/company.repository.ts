import pool from '../config/database';
import { Company, CompanyCreateInput, CompanyUpdateInput } from '../models/Company';

export class CompanyRepository {
  async create(userId: number, company: CompanyCreateInput): Promise<Company> {
    const { company_name, industry, revenue, employees, address, city, country, website } = company;
    const result = await pool.query(
      `INSERT INTO company_profiles (user_id, company_name, industry, revenue, employees, address, city, country, website) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [userId, company_name, industry, revenue, employees, address, city, country, website]
    );
    return result.rows[0];
  }

  async findByUserId(userId: number): Promise<Company | null> {
    const result = await pool.query('SELECT * FROM company_profiles WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  }

  async findById(id: number): Promise<Company | null> {
    const result = await pool.query('SELECT * FROM company_profiles WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async update(id: number, company: CompanyUpdateInput): Promise<Company | null> {
    const fields = Object.keys(company)
      .filter((key) => company[key as keyof CompanyUpdateInput] !== undefined)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    if (fields.length === 0) return this.findById(id);

    const values = Object.values(company).filter((val) => val !== undefined);
    const result = await pool.query(
      `UPDATE company_profiles SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM company_profiles WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export default new CompanyRepository();
