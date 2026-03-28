export interface IncidentTypeBreakdown {
  FRAUD: number;
  CONTRACT_BREACH: number;
  PAYMENT_ISSUE: number;
  QUALITY_ISSUE: number;
  SERVICE_ISSUE: number;
  OTHER: number;
}

export interface ReputationScore {
  company_gstn: string | null;  // null for non-GSTN / unregistered companies
  company_name: string;
  reputation_score: number;
  label: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  total_incidents: number;
  breakdown: IncidentTypeBreakdown;
}
