import api from './api';

export interface AuditLogSearchParams {
  incident_id?: number;
  moderator_id?: number;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface AuditLog {
  id: number;
  incident_id: number;
  moderator_id: number;
  action: string;
  notes: string | null;
  created_at: string;
}

export interface AuditLogSearchResult {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const auditLogService = {
  async searchLogs(params: AuditLogSearchParams): Promise<AuditLogSearchResult> {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },
};
