import type { Context } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import companyService from '../services/company.service';
import auditLogService from '../services/auditLog.service';

export class CompanyController {
  async createCompany(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const company = await companyService.createCompany(db, user.id, body);

      try {
        await auditLogService.writeLog(db, {
          user_id: user.id,
          action: 'company_profile_created',
          entity_type: 'company',
          entity_id: company.id,
          details: { company_name: company.company_name },
          ip_address:
            c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(company, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  async getCompany(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const company = await companyService.getCompanyByUserId(db, user.id);
      if (!company) {
        return c.json({ error: 'Company profile not found' }, 404);
      }

      return c.json(company, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  async updateCompany(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const companyId = parseInt(c.req.param('id')!);
      const body = await c.req.json();
      const company = await companyService.updateCompany(db, companyId, body);

      try {
        await auditLogService.writeLog(db, {
          user_id: user.id,
          action: 'company_profile_updated',
          entity_type: 'company',
          entity_id: companyId,
          details: { updated_fields: Object.keys(body) },
          ip_address:
            c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(company, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  async deleteCompany(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const companyId = parseInt(c.req.param('id')!);
      await companyService.deleteCompany(db, companyId);

      try {
        await auditLogService.writeLog(db, {
          user_id: user.id,
          action: 'company_profile_deleted',
          entity_type: 'company',
          entity_id: companyId,
          ip_address:
            c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.body(null, 204);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
}

export default new CompanyController();
