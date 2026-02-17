import companyRepository from '../repositories/company.repository';
import { Company, CompanyCreateInput, CompanyUpdateInput } from '../models/Company';

export class CompanyService {
  async createCompany(userId: number, companyData: CompanyCreateInput): Promise<Company> {
    // Check if user already has a company profile
    const existing = await companyRepository.findByUserId(userId);
    if (existing) {
      throw new Error('User already has a company profile');
    }

    return await companyRepository.create(userId, companyData);
  }

  async getCompanyByUserId(userId: number): Promise<Company | null> {
    return await companyRepository.findByUserId(userId);
  }

  async updateCompany(companyId: number, companyData: CompanyUpdateInput): Promise<Company> {
    const updated = await companyRepository.update(companyId, companyData);
    if (!updated) {
      throw new Error('Company not found');
    }
    return updated;
  }

  async deleteCompany(companyId: number): Promise<void> {
    const deleted = await companyRepository.delete(companyId);
    if (!deleted) {
      throw new Error('Company not found');
    }
  }
}

export default new CompanyService();
