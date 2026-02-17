import companyService from '../../services/company.service';
import companyRepository from '../../repositories/company.repository';

// Mock the company repository
jest.mock('../../repositories/company.repository');

describe('CompanyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCompany', () => {
    it('should create a new company profile', async () => {
      const userId = 1;
      const companyData = {
        company_name: 'Test Corp',
        industry: 'Technology',
        revenue: 1000000,
        employees: 50,
      };

      const mockCompany = {
        id: 1,
        user_id: userId,
        ...companyData,
        updated_at: new Date(),
      };

      (companyRepository.findByUserId as jest.Mock).mockResolvedValue(null);
      (companyRepository.create as jest.Mock).mockResolvedValue(mockCompany);

      const result = await companyService.createCompany(userId, companyData);

      expect(result).toEqual(mockCompany);
      expect(companyRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(companyRepository.create).toHaveBeenCalledWith(userId, companyData);
    });

    it('should throw error if user already has a company profile', async () => {
      const userId = 1;
      const companyData = {
        company_name: 'Test Corp',
        industry: 'Technology',
      };

      (companyRepository.findByUserId as jest.Mock).mockResolvedValue({
        id: 1,
        user_id: userId,
        company_name: 'Existing Corp',
      });

      await expect(companyService.createCompany(userId, companyData)).rejects.toThrow(
        'User already has a company profile'
      );
    });
  });

  describe('getCompanyByUserId', () => {
    it('should return company by user id', async () => {
      const userId = 1;
      const mockCompany = {
        id: 1,
        user_id: userId,
        company_name: 'Test Corp',
        industry: 'Technology',
        updated_at: new Date(),
      };

      (companyRepository.findByUserId as jest.Mock).mockResolvedValue(mockCompany);

      const result = await companyService.getCompanyByUserId(userId);

      expect(result).toEqual(mockCompany);
      expect(companyRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return null if company not found', async () => {
      const userId = 999;

      (companyRepository.findByUserId as jest.Mock).mockResolvedValue(null);

      const result = await companyService.getCompanyByUserId(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateCompany', () => {
    it('should update company successfully', async () => {
      const companyId = 1;
      const updateData = {
        company_name: 'Updated Corp',
        revenue: 2000000,
      };

      const mockUpdatedCompany = {
        id: companyId,
        ...updateData,
        updated_at: new Date(),
      };

      (companyRepository.update as jest.Mock).mockResolvedValue(mockUpdatedCompany);

      const result = await companyService.updateCompany(companyId, updateData);

      expect(result).toEqual(mockUpdatedCompany);
      expect(companyRepository.update).toHaveBeenCalledWith(companyId, updateData);
    });

    it('should throw error if company not found', async () => {
      const companyId = 999;
      const updateData = { company_name: 'Updated Corp' };

      (companyRepository.update as jest.Mock).mockResolvedValue(null);

      await expect(companyService.updateCompany(companyId, updateData)).rejects.toThrow(
        'Company not found'
      );
    });
  });

  describe('deleteCompany', () => {
    it('should delete company successfully', async () => {
      const companyId = 1;

      (companyRepository.delete as jest.Mock).mockResolvedValue(true);

      await companyService.deleteCompany(companyId);

      expect(companyRepository.delete).toHaveBeenCalledWith(companyId);
    });

    it('should throw error if company not found', async () => {
      const companyId = 999;

      (companyRepository.delete as jest.Mock).mockResolvedValue(false);

      await expect(companyService.deleteCompany(companyId)).rejects.toThrow('Company not found');
    });
  });
});
