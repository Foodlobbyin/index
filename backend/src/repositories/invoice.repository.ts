import type { DbClient } from '../config/database';
import { Invoice, InvoiceCreateInput, InvoiceUpdateInput, MarketInsights } from '../models/Invoice';

export class InvoiceRepository {
  async create(db: DbClient, companyId: number, invoice: InvoiceCreateInput): Promise<Invoice> {
    const { invoice_number, amount, amount_unpaid, issue_date, due_date, status, description, category } = invoice;
    const result = await db.query(
      `INSERT INTO invoices (company_id, invoice_number, amount, amount_unpaid, issue_date, due_date, status, description, category) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [companyId, invoice_number, amount, amount_unpaid ?? null, issue_date, due_date, status || 'pending', description, category]
    );
    return result.rows[0];
  }

  async findByCompanyId(db: DbClient, companyId: number): Promise<Invoice[]> {
    const result = await db.query(
      'SELECT * FROM invoices WHERE company_id = $1 ORDER BY created_at DESC',
      [companyId]
    );
    return result.rows;
  }

  async findById(db: DbClient, id: number): Promise<Invoice | null> {
    const result = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async update(db: DbClient, id: number, invoice: InvoiceUpdateInput): Promise<Invoice | null> {
    const fields = Object.keys(invoice)
      .filter((key) => invoice[key as keyof InvoiceUpdateInput] !== undefined)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    if (fields.length === 0) return this.findById(db, id);

    const values = Object.values(invoice).filter((val) => val !== undefined);
    const result = await db.query(
      `UPDATE invoices SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  }

  async delete(db: DbClient, id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM invoices WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }

  async getMarketInsights(db: DbClient, industry?: string): Promise<MarketInsights[]> {
    let query = `
      SELECT 
        cp.industry,
        AVG(cp.revenue) as avg_revenue,
        AVG(cp.employees) as avg_employees,
        SUM(i.amount) as total_invoiced,
        COUNT(DISTINCT cp.id) as data_points,
        AVG(i.amount) as avg_invoice_amount
      FROM company_profiles cp
      LEFT JOIN invoices i ON cp.id = i.company_id
      WHERE cp.industry IS NOT NULL
    `;
    
    const params: any[] = [];
    if (industry) {
      query += ' AND cp.industry = $1';
      params.push(industry);
    }
    
    query += ' GROUP BY cp.industry ORDER BY data_points DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }
}

export default new InvoiceRepository();
