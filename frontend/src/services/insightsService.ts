import api from './api';

export interface DashboardStats {
  totalCompanies: number;
  totalInvoices: number;
  unpaidInvoices: number;
  totalUsers: number;
  resolvedIssues: number;
  casesThisMonth: number;
}

export interface StateUnpaidData {
  state_code: string;
  state_name: string;
  unpaid_amount: number;
  incident_count: number;
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
      casesThisMonth: d.casesThisMonth ?? 0,
    };
  },

  async getStateUnpaidData(): Promise<StateUnpaidData[]> {
    const response = await api.get('/insights/states');
    const GSTIN_STATE_MAP: Record<string, string> = {
      '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
      '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
      '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
      '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
      '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
      '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
      '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
      '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
      '25': 'Daman & Diu', '26': 'Dadra & NH', '27': 'Maharashtra',
      '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
      '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
      '35': 'Andaman & Nicobar', '36': 'Telangana', '37': 'Andhra Pradesh',
      '38': 'Ladakh',
    };
    return (response.data.states ?? []).map((r: any) => ({
      state_code:     r.state_code,
      state_name:     GSTIN_STATE_MAP[r.state_code] ?? `State ${r.state_code}`,
      unpaid_amount:  r.unpaid_amount ?? 0,
      incident_count: r.incident_count ?? 0,
    }));
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
