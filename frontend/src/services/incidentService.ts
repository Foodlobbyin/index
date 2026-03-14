import api from './api';

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
  incident_date: string;
  incident_title: string;
  description: string;
  amount_involved?: number;
  currency_code: string;
  reporter_id?: number;
  is_anonymous: boolean;
  reporter_name?: string;
  reporter_email?: string;
  status: IncidentStatus;
  moderator_notes?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentCreateInput {
  company_gstn?: string;
  company_name: string;
  incident_type: IncidentType;
  incident_date: string;
  incident_title: string;
  description: string;
  amount_involved?: number;
  currency_code?: string;
  is_anonymous?: boolean;
}

export interface IncidentUpdateInput {
  company_gstn?: string;
  company_name?: string;
  incident_type?: IncidentType;
  incident_date?: string;
  incident_title?: string;
  description?: string;
  amount_involved?: number;
  currency_code?: string;
}

export interface IncidentSearchParams {
  gstn?: string;
  company_name?: string;
  incident_type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface IncidentSearchResult {
  incidents: Incident[];
  total: number;
}

export const incidentService = {
  async search(params: IncidentSearchParams): Promise<IncidentSearchResult> {
    const response = await api.get('/incidents/search', { params });
    return response.data;
  },

  async getById(id: number): Promise<Incident> {
    const response = await api.get(`/incidents/${id}`);
    return response.data.incident ?? response.data;
  },

  async submit(data: IncidentCreateInput): Promise<Incident> {
    const response = await api.post('/incidents/submit', data);
    return response.data.incident ?? response.data;
  },

  async update(id: number, data: IncidentUpdateInput): Promise<Incident> {
    const response = await api.put(`/incidents/${id}`, data);
    return response.data.incident ?? response.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/incidents/${id}`);
  },

  async getModerationQueue(): Promise<Incident[]> {
    const response = await api.get('/moderation/queue');
    return response.data.incidents ?? response.data;
  },

  async approveIncident(id: number, notes?: string): Promise<void> {
    await api.put(`/moderation/incidents/${id}/approve`, { notes });
  },

  async rejectIncident(id: number, reason?: string, notes?: string): Promise<void> {
    await api.put(`/moderation/incidents/${id}/reject`, { reason, notes });
  },
};
