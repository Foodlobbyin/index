import { Response } from 'express';
import companyService from '../services/company.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class CompanyController {
  async createCompany(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const company = await companyService.createCompany(req.user.id, req.body);
      res.status(201).json(company);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getCompany(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const company = await companyService.getCompanyByUserId(req.user.id);
      if (!company) {
        res.status(404).json({ error: 'Company profile not found' });
        return;
      }

      res.status(200).json(company);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateCompany(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const companyId = parseInt(req.params.id);
      const company = await companyService.updateCompany(companyId, req.body);
      res.status(200).json(company);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteCompany(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const companyId = parseInt(req.params.id);
      await companyService.deleteCompany(companyId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new CompanyController();
