/**
 * Incident System Type Definitions
 * 
 * Complete TypeScript interfaces matching the database schema
 * defined in migrations 003_add_incidents_schema.sql and
 * 007_add_exchange_rates.sql.
 * 
 * Phase 2: Backend Models (TypeScript) — IMPLEMENTATION_CHECKLIST.md
 * 
 * @author Foodlobbyin
 * @date 2026-03-28
 */

// ============================================================
// ENUMS & TYPES
// ============================================================

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

export type TrustLevel =
  | 'basic'
  | 'verified'
  | 'trusted'
  | 'moderator'
  | 'admin';

export type ModerationAction =
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DELETED'
  | 'RESTORED';

// ============================================================
// INCIDENT CORE
// ============================================================

export interface Incident {
  id: number;
  
  // Company being reported
  company_gstn: string | null;
  company_name: string;
  
  // Incident details
  incident_type: IncidentType;
  incident_date: Date;
  incident_title: string;
  description: string;
  
  // Financial impact
  amount_involved: number | null;
  currency_code: string;  // Default: 'INR'
  
  // Reporter information
  reporter_id: number | null;
  is_anonymous: boolean;  // Default: false
  reporter_name: string | null;
  reporter_email: string | null;
  reporter_phone: string | null;
  
  // Status & moderation
  status: IncidentStatus;  // Default: 'draft'
  moderator_notes: string | null;
  reviewed_by: number | null;
  reviewed_at: Date | null;
  rejection_reason: string | null;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

// ============================================================
// INCIDENT EVIDENCE
// ============================================================

export interface IncidentEvidence {
  id: number;
  incident_id: number;
  
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  
  uploaded_by: number | null;
  created_at: Date;
}

// ============================================================
// INCIDENT RESPONSES
// ============================================================

export interface IncidentResponse {
  id: number;
  incident_id: number;
  
  responder_gstn: string;
  responder_name: string | null;
  response_text: string;
  
  responded_at: Date;
  created_at: Date;
}

// ============================================================
// MODERATION LOG
// ============================================================

export interface IncidentModerationLog {
  id: number;
  incident_id: number;
  moderator_id: number | null;
  
  action: ModerationAction;
  notes: string | null;
  
  created_at: Date;
}

// ============================================================
// CONTACT PERSONS
// ============================================================

export interface ContactPerson {
  id: number;
  
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  
  created_at: Date;
}

// ============================================================
// INCIDENT PENALTIES
// ============================================================

export interface IncidentPenalty {
  id: number;
  incident_id: number;
  
  penalty_amount: number;  // CHECK: > 0
  currency_code: string;   // Default: 'INR'
  penalty_reason: string;
  
  imposed_by: number;
  imposed_at: Date;
  created_at: Date;
}

// ============================================================
// EXCHANGE RATES
// ============================================================

export interface ExchangeRate {
  id: number;
  
  from_currency: string;  // ISO 4217, e.g. 'USD'
  to_currency: string;    // ISO 4217, e.g. 'INR'
  rate: number;           // CHECK: > 0
  
  effective_date: Date;
  source: string | null;  // e.g. 'seed_baseline', 'rbi_api'
  
  created_at: Date;
  updated_at: Date;
}

// ============================================================
// REQUEST/RESPONSE DTOs
// ============================================================

export interface CreateIncidentRequest {
  company_gstn?: string | null;
  company_name: string;
  incident_type: IncidentType;
  incident_date: string;  // ISO date string
  incident_title: string;
  description: string;
  amount_involved?: number;
  currency_code?: string;
  is_anonymous?: boolean;
}

export interface UpdateIncidentRequest {
  company_name?: string;
  incident_type?: IncidentType;
  incident_date?: string;
  incident_title?: string;
  description?: string;
  amount_involved?: number;
  currency_code?: string;
}

export interface SearchFilters {
  status?: IncidentStatus | IncidentStatus[];
  incident_type?: IncidentType;
  date_from?: Date;
  date_to?: Date;
  min_amount?: number;
  max_amount?: number;
}

export interface ModerationDecision {
  action: 'approve' | 'reject';
  notes?: string;
  rejection_reason?: string;  // Required if action = 'reject'
}

// ============================================================
// USER EXTENDED (with trust level)
// ============================================================

export interface UserExtended {
  id: number;
  username: string;
  email: string;
  mobile_number: string;
  
  // Trust system (from 008_alter_users_trust_level.sql)
  trust_level: TrustLevel;             // Default: 'basic'
  approved_incidents_count: number;    // Default: 0
  incidents_always_anonymous: boolean; // Default: true
  forums_default_anonymous: boolean;   // Default: false
  
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}
