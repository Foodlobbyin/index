import type { DbClient } from '../config/database';
import companyRepository from '../repositories/company.repository';
import { Company, CompanyCreateInput, CompanyUpdateInput } from '../models/Company';

export class CompanyService {
  async createCompany(db: DbClient, userId: number, companyData: CompanyCreateInput): Promise<Company> {
    // Check if user already has a company profile
    const existing = await companyRepository.findByUserId(db, userId);
    if (existing) {
      throw new Error('User already has a company profile');
    }

    return await companyRepository.create(db, userId, companyData);
  }

  async getCompanyByUserId(db: DbClient, userId: number): Promise<Company | null> {
    return await companyRepository.findByUserId(db, userId);
  }

  async updateCompany(db: DbClient, companyId: number, companyData: CompanyUpdateInput): Promise<Company> {
    const updated = await companyRepository.update(db, companyId, companyData);
    if (!updated) {
      throw new Error('Company not found');
    }
    return updated;
  }

  async deleteCompany(db: DbClient, companyId: number): Promise<void> {
    const deleted = await companyRepository.delete(db, companyId);
    if (!deleted) {
      throw new Error('Company not found');
    }
  }
}

export default new CompanyService();
