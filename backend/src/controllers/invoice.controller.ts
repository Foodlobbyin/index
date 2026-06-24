import type { Context } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import invoiceService from '../services/invoice.service';
import auditLogService from '../services/auditLog.service';

export class InvoiceController {
  async createInvoice(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const body = await c.req.json();
      const invoice = await invoiceService.createInvoice(db, user.id, body);

      try {
        await auditLogService.writeLog(db, {
          user_id: user.id,
          action: 'invoice_created',
          entity_type: 'invoice',
          entity_id: invoice.id,
          details: { invoice_id: invoice.id, amount: invoice.amount, invoice_number: invoice.invoice_number },
          ip_address:
            c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(invoice, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  async getInvoices(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const invoices = await invoiceService.getInvoicesByUserId(db, user.id);
      return c.json(invoices, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  async getInvoiceById(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const invoiceId = parseInt(c.req.param('id')!);
      const invoice = await invoiceService.getInvoiceById(db, invoiceId, user.id);
      return c.json(invoice, 200);
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        return c.json({ error: error.message }, 403);
      } else {
        return c.json({ error: error.message }, 404);
      }
    }
  }

  async updateInvoice(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const invoiceId = parseInt(c.req.param('id')!);
      const body = await c.req.json();
      const invoice = await invoiceService.updateInvoice(db, invoiceId, user.id, body);

      try {
        await auditLogService.writeLog(db, {
          user_id: user.id,
          action: 'invoice_updated',
          entity_type: 'invoice',
          entity_id: invoiceId,
          details: { invoice_id: invoiceId, changed_fields: Object.keys(body) },
          ip_address:
            c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(invoice, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  async deleteInvoice(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const invoiceId = parseInt(c.req.param('id')!);
      await invoiceService.deleteInvoice(db, invoiceId, user.id);

      try {
        await auditLogService.writeLog(db, {
          user_id: user.id,
          action: 'invoice_deleted',
          entity_type: 'invoice',
          entity_id: invoiceId,
          details: { invoice_id: invoiceId },
          ip_address:
            c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.body(null, 204);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  async getMarketInsights(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const industry = c.req.query('industry') as string | undefined;
      const insights = await invoiceService.getMarketInsights(db, industry);
      return c.json(insights, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
}

export default new InvoiceController();
