export interface Invoice {
  id: number;
  company_id: number;
  invoice_number: string;
  amount: number;
  issue_date: Date;
  due_date: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  category?: string;
  created_at: Date;
}

export interface InvoiceCreateInput {
  invoice_number: string;
  amount: number;
  issue_date: Date;
  due_date: Date;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  category?: string;
}

export interface InvoiceUpdateInput {
  invoice_number?: string;
  amount?: number;
  issue_date?: Date;
  due_date?: Date;
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
  payment_trends?: {
    on_time: number;
    late: number;
    overdue: number;
  };
}
