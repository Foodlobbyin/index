export interface ContactPerson {
  id: number;
  company_gstn: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  designation?: string;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ContactPersonCreateInput {
  company_gstn: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  designation?: string;
  is_primary?: boolean;
}
