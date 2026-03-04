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
}

export interface IncidentCreateInput {
  company_gstn?: string;
  company_name: string;
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