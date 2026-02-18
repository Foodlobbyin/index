import api from './api';

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

export interface CompanyInput {
  company_name: string;
  industry?: string;
  revenue?: number;
  employees?: number;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
}

export const companyService = {
  async createCompany(data: CompanyInput): Promise<Company> {
    const response = await api.post('/company', data);
    return response.data;
  },

  async getCompany(): Promise<Company> {
    const response = await api.get('/company');
    return response.data;
  },

  async updateCompany(id: number, data: Partial<CompanyInput>): Promise<Company> {
    const response = await api.put(`/company/${id}`, data);
    return response.data;
  },

  async deleteCompany(id: number): Promise<void> {
    await api.delete(`/company/${id}`);
  },
};
