import invoiceRepository from '../repositories/invoice.repository';
import companyRepository from '../repositories/company.repository';
import { Invoice, InvoiceCreateInput, InvoiceUpdateInput, MarketInsights } from '../models/Invoice';

export class InvoiceService {
  async createInvoice(userId: number, invoiceData: InvoiceCreateInput): Promise<Invoice> {
    // Get user's company
    const company = await companyRepository.findByUserId(userId);
    if (!company) {
      throw new Error('Company profile not found. Please create a company profile first.');
    }

    return await invoiceRepository.create(company.id, invoiceData);
  }

  async getInvoicesByUserId(userId: number): Promise<Invoice[]> {
    const company = await companyRepository.findByUserId(userId);
    if (!company) {
      return [];
    }
    return await invoiceRepository.findByCompanyId(company.id);
  }

  async getInvoiceById(id: number, userId: number): Promise<Invoice> {
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Verify ownership
    const company = await companyRepository.findByUserId(userId);
    if (!company || company.id !== invoice.company_id) {
      throw new Error('Unauthorized');
    }

    return invoice;
  }

  async updateInvoice(id: number, userId: number, invoiceData: InvoiceUpdateInput): Promise<Invoice> {
    // Verify ownership first
    await this.getInvoiceById(id, userId);
    
    const updated = await invoiceRepository.update(id, invoiceData);
    if (!updated) {
      throw new Error('Invoice not found');
    }
    return updated;
  }

  async deleteInvoice(id: number, userId: number): Promise<void> {
    // Verify ownership first
    await this.getInvoiceById(id, userId);
    
    const deleted = await invoiceRepository.delete(id);
    if (!deleted) {
      throw new Error('Invoice not found');
    }
  }

  async getMarketInsights(industry?: string): Promise<MarketInsights[]> {
    return await invoiceRepository.getMarketInsights(industry);
  }
}

export default new InvoiceService();
