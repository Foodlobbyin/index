export interface AuditLog {
  id: number;
  incident_id: number;
  moderator_id: number | null;
  action: string;
  notes: string | null;
  created_at: Date;
}

export interface AuditLogSearchParams {
  incident_id?: number;
  moderator_id?: number;
  action?: string;
  date_from?: string; // ISO date string
  date_to?: string;   // ISO date string
  page?: number;
  limit?: number;
}

export interface AuditLogSearchResult {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
