export interface IncidentEvidence {
  id: number;
  incident_id: number;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by?: number;
  created_at: Date;
}

export interface EvidenceCreateInput {
  incident_id: number;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by?: number;
}
