export interface IncidentResponse {
  id: number;
  incident_id: number;
  responder_gstn: string;
  responder_name?: string;
  response_text: string;
  responded_at: Date;
  created_at: Date;
}

export interface IncidentResponseCreateInput {
  incident_id: number;
  responder_gstn: string;
  responder_name?: string;
  response_text: string;
}
