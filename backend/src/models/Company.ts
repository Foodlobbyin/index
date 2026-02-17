export interface Company {
  id: number;
  user_id: number;
  company_name: string;
  industry?: string;
  revenue?: number;
  employees?: number;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  updated_at: Date;
}

export interface CompanyCreateInput {
  company_name: string;
  industry?: string;
  revenue?: number;
  employees?: number;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
}

export interface CompanyUpdateInput {
  company_name?: string;
  industry?: string;
  revenue?: number;
  employees?: number;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
}
