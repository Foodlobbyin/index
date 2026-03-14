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

/** Input for writing a general-purpose audit log entry to the audit_logs table. */
export interface WriteAuditLogInput {
  user_id?: number | null;
  action: string;
  entity_type?: string | null;
  entity_id?: number | null;
  details?: Record<string, unknown> | null;
  ip_address?: string | null;
}
