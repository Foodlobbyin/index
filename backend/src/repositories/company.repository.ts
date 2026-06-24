import type { DbClient } from '../config/database';
import { Company, CompanyCreateInput, CompanyUpdateInput } from '../models/Company';

export class CompanyRepository {
  async create(db: DbClient, userId: number, company: CompanyCreateInput): Promise<Company> {
    const { company_name, industry, revenue, employees, address, city, country, website } = company;
    const result = await db.query(
      `INSERT INTO company_profiles (user_id, company_name, industry, revenue, employees, address, city, country, website) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [userId, company_name, industry, revenue, employees, address, city, country, website]
    );
    return result.rows[0];
  }

  async findByUserId(db: DbClient, userId: number): Promise<Company | null> {
    const result = await db.query('SELECT * FROM company_profiles WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  }

  async findById(db: DbClient, id: number): Promise<Company | null> {
    const result = await db.query('SELECT * FROM company_profiles WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async update(db: DbClient, id: number, company: CompanyUpdateInput): Promise<Company | null> {
    const fields = Object.keys(company)
      .filter((key) => company[key as keyof CompanyUpdateInput] !== undefined)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    if (fields.length === 0) return this.findById(db, id);

    const values = Object.values(company).filter((val) => val !== undefined);
    const result = await db.query(
      `UPDATE company_profiles SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  }

  async delete(db: DbClient, id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM company_profiles WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }
}

export default new CompanyRepository();
