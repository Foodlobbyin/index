export interface IncidentPenalty {
  id: number;
  incident_id: number;
  penalty_amount: number;
  currency_code: string;
  penalty_reason: string;
  imposed_by: number;
  imposed_at: Date;
  created_at: Date;
}

export interface IncidentPenaltyCreateInput {
  incident_id: number;
  penalty_amount: number;
  currency_code?: string;
  penalty_reason: string;
  imposed_by: number;
}
