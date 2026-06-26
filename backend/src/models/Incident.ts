export type IncidentType =
  | 'FRAUD'
  | 'QUALITY_ISSUE'
  | 'SERVICE_ISSUE'
  | 'PAYMENT_ISSUE'
  | 'CONTRACT_BREACH'
  | 'OTHER';

export type IncidentStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'resolved';

export interface CompanyResponse {
  id: number;
  response_text: string;
  default_categories: string[];
  responded_at: string;
}

export interface Incident {
  id: number;
  company_gstn?: string;
  company_name: string;
  incident_type: IncidentType;
  incident_date: Date;
  incident_title: string;
  description: string;
  amount_involved?: number;
  currency_code: string;
  reporter_id?: number;
  is_anonymous: boolean;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  status: IncidentStatus;
  moderator_notes?: string;
  reviewed_by?: number;
  reviewed_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
  /** Latest response submitted by the accused company via My Defaults page. */
  company_response?: CompanyResponse | null;
}

export interface IncidentCreateInput {
  company_gstn?: string;
  company_name: string;
  // Company address fields — saved to companies table
  state?: string;
  pincode?: string;
  street_address?: string;
  msme_udyam_number?: string;
  incident_type: IncidentType;
  incident_date: Date | string;
  incident_title: string;
  description: string;
  amount_involved?: number;
  currency_code?: string;
  is_anonymous?: boolean;
  reporter_id?: number;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  invoices?: unknown[];
  contact_persons?: unknown[];
}

export interface IncidentUpdateInput {
  company_gstn?: string;
  company_name?: string;
  incident_type?: IncidentType;
  incident_date?: Date | string;
  incident_title?: string;
  description?: string;
  amount_involved?: number;
  currency_code?: string;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
}

export interface IncidentSearchParams {
  gstn?: string;
  company_name?: string;
  incident_type?: string;
  status?: string;
  page?: number;
  limit?: number;
}