import type { DbClient } from '../config/database';
import invoiceRepository from '../repositories/invoice.repository';
import companyRepository from '../repositories/company.repository';
import { Invoice, InvoiceCreateInput, InvoiceUpdateInput, MarketInsights } from '../models/Invoice';

export class InvoiceService {
  async createInvoice(db: DbClient, userId: number, invoiceData: InvoiceCreateInput): Promise<Invoice> {
    // Get user's company
    const company = await companyRepository.findByUserId(db, userId);
    if (!company) {
      throw new Error('Company profile not found. Please create a company profile first.');
    }

    return await invoiceRepository.create(db, company.id, invoiceData);
  }

  async getInvoicesByUserId(db: DbClient, userId: number): Promise<Invoice[]> {
    const company = await companyRepository.findByUserId(db, userId);
    if (!company) {
      return [];
    }
    return await invoiceRepository.findByCompanyId(db, company.id);
  }

  async getInvoiceById(db: DbClient, id: number, userId: number): Promise<Invoice> {
    const invoice = await invoiceRepository.findById(db, id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Verify ownership
    const company = await companyRepository.findByUserId(db, userId);
    if (!company || company.id !== invoice.company_id) {
      throw new Error('Unauthorized');
    }

    return invoice;
  }

  async updateInvoice(db: DbClient, id: number, userId: number, invoiceData: InvoiceUpdateInput): Promise<Invoice> {
    // Verify ownership first
    await this.getInvoiceById(db, id, userId);

    const updated = await invoiceRepository.update(db, id, invoiceData);
    if (!updated) {
      throw new Error('Invoice not found');
    }
    return updated;
  }

  async deleteInvoice(db: DbClient, id: number, userId: number): Promise<void> {
    // Verify ownership first
    await this.getInvoiceById(db, id, userId);

    const deleted = await invoiceRepository.delete(db, id);
    if (!deleted) {
      throw new Error('Invoice not found');
    }
  }

  async getMarketInsights(db: DbClient, industry?: string): Promise<MarketInsights[]> {
    return await invoiceRepository.getMarketInsights(db, industry);
  }
}

export default new InvoiceService();
