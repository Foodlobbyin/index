export interface Incident {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  restaurant_name?: string;
  location?: string;
  date_occurred: Date;
  evidence_urls?: string[];
  resolution_notes?: string;
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export enum IncidentCategory {
  FOOD_QUALITY = 'food_quality',
  HYGIENE = 'hygiene',
  SERVICE = 'service',
  PRICING = 'pricing',
  SAFETY = 'safety',
  OTHER = 'other'
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IncidentStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected'
}

export interface IncidentCreateInput {
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  restaurant_name?: string;
  location?: string;
  date_occurred: Date;
  evidence_urls?: string[];
}

export interface IncidentUpdateInput {
  title?: string;
  description?: string;
  category?: IncidentCategory;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  restaurant_name?: string;
  location?: string;
  date_occurred?: Date;
  evidence_urls?: string[];
  resolution_notes?: string;
}