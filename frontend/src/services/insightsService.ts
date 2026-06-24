import api from './api';

export interface DashboardStats {
  totalCompanies: number;
  totalInvoices: number;
  unpaidInvoices: number;
  totalUsers: number;
  resolvedIssues: number;
}

export interface InvoiceByMonth {
  month: string;
  paid: number;
  unpaid: number;
}

export interface InvoiceByStatus {
  status: string;
  count: number;
  value: number;
}

export interface MarketInsight {
  industry: string;
  averageRevenue: number;
  averageEmployees: number;
  totalInvoiced: number;
  dataPoints: number;
}

export const insightsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/insights/dashboard');
    const d = response.data;
    return {
      totalCompanies: d.totalCompanies ?? 0,
      totalInvoices:  d.totalInvoices  ?? 0,
      unpaidInvoices: d.unpaidInvoices ?? 0,
      totalUsers:     0, // not currently tracked separately
      resolvedIssues: d.resolvedIssues ?? 0,
    };
  },

  async getInvoicesByMonth(): Promise<InvoiceByMonth[]> {
    const response = await api.get('/insights/dashboard');
    return (response.data.invoicesByMonth ?? []).map((r: any) => ({
      month:  r.month,
      paid:   r.paid,
      unpaid: r.unpaid,
    }));
  },

  async getInvoicesByStatus(): Promise<InvoiceByStatus[]> {
    const response = await api.get('/insights/dashboard');
    return (response.data.invoicesByStatus ?? []).map((r: any) => ({
      status: r.status,
      count:  r.count,
      value:  r.value,
    }));
  },

  async getMarketInsights(industry?: string): Promise<MarketInsight[]> {
    try {
      const url = industry ? `/insights?industry=${industry}` : '/insights';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching market insights:', error);
      return [];
    }
  },
};
