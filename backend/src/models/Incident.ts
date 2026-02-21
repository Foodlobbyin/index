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
  company_gstn: string;
  company_name: string;
  incident_type: IncidentType;
  incident_date: Date;
  incident_title: string;
  description: string;
  amount_involved?: number;
  currency_code: string;
  status: IncidentStatus;
  is_anonymous: boolean;
  reporter_id?: number;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  moderator_notes?: string;
  reviewed_by?: number;
  reviewed_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IncidentCreateInput {
  company_gstn: string;
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
  status?: IncidentStatus;
  incident_type?: IncidentType;
  page?: number;
  limit?: number;
}

export const VALID_INCIDENT_TYPES: IncidentType[] = [
  'FRAUD',
  'QUALITY_ISSUE',
  'SERVICE_ISSUE',
  'PAYMENT_ISSUE',
  'CONTRACT_BREACH',
  'OTHER',
];

export const VALID_INCIDENT_STATUSES: IncidentStatus[] = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'resolved',
];
