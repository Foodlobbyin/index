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
    try {
      const response = await api.get('/insights');
      // Map API response to dashboard stats
      const insights = response.data;
      
      return {
        totalCompanies: insights.length || 0,
        totalInvoices: insights.reduce((sum: number, i: any) => sum + (i.totalInvoiced || 0), 0),
        unpaidInvoices: Math.floor(Math.random() * 50), // Mock for now
        totalUsers: 150, // Mock for now
        resolvedIssues: 45, // Mock for now
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data on error
      return {
        totalCompanies: 127,
        totalInvoices: 543,
        unpaidInvoices: 42,
        totalUsers: 156,
        resolvedIssues: 38,
      };
    }
  },

  async getInvoicesByMonth(): Promise<InvoiceByMonth[]> {
    // Mock data for now - can be replaced with real API
    return [
      { month: 'Jan', paid: 45, unpaid: 12 },
      { month: 'Feb', paid: 52, unpaid: 8 },
      { month: 'Mar', paid: 48, unpaid: 15 },
      { month: 'Apr', paid: 61, unpaid: 10 },
      { month: 'May', paid: 55, unpaid: 14 },
      { month: 'Jun', paid: 67, unpaid: 9 },
    ];
  },

  async getInvoicesByStatus(): Promise<InvoiceByStatus[]> {
    // Mock data for now - can be replaced with real API
    return [
      { status: 'Paid', count: 328, value: 4250000 },
      { status: 'Unpaid', count: 68, value: 890000 },
      { status: 'In Dispute', count: 12, value: 156000 },
      { status: 'Resolved', count: 45, value: 585000 },
    ];
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
