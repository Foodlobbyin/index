import api from './api';

export interface Invoice {
  id: number;
  company_id: number;
  invoice_number: string;
  amount: number;
  issue_date: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  category?: string;
  created_at: string;
}

export interface InvoiceInput {
  invoice_number: string;
  amount: number;
  issue_date: string;
  due_date: string;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  category?: string;
}

export interface MarketInsights {
  industry: string;
  avg_revenue: number;
  avg_employees: number;
  total_invoiced: number;
  data_points: number;
  avg_invoice_amount?: number;
}

export const invoiceService = {
  async createInvoice(data: InvoiceInput): Promise<Invoice> {
    const response = await api.post('/invoices', data);
    return response.data;
  },

  async getInvoices(): Promise<Invoice[]> {
    const response = await api.get('/invoices');
    return response.data;
  },

  async getInvoiceById(id: number): Promise<Invoice> {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  async updateInvoice(id: number, data: Partial<InvoiceInput>): Promise<Invoice> {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  },

  async deleteInvoice(id: number): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },

  async getMarketInsights(industry?: string): Promise<MarketInsights[]> {
    const url = industry ? `/insights?industry=${industry}` : '/insights';
    const response = await api.get(url);
    return response.data;
  },
};
