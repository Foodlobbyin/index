import { Response } from 'express';
import invoiceService from '../services/invoice.service';
import auditLogService from '../services/auditLog.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class InvoiceController {
  async createInvoice(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const invoice = await invoiceService.createInvoice(req.user.id, req.body);

      try {
        await auditLogService.writeLog({
          user_id: req.user.id,
          action: 'invoice_created',
          entity_type: 'invoice',
          entity_id: invoice.id,
          details: { invoice_id: invoice.id, amount: invoice.amount, invoice_number: invoice.invoice_number },
          ip_address: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        });
      } catch { /* audit log failure must not break the main action */ }

      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getInvoices(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const invoices = await invoiceService.getInvoicesByUserId(req.user.id);
      res.status(200).json(invoices);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getInvoiceById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const invoiceId = parseInt(req.params.id);
      const invoice = await invoiceService.getInvoiceById(invoiceId, req.user.id);
      res.status(200).json(invoice);
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(404).json({ error: error.message });
      }
    }
  }

  async updateInvoice(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const invoiceId = parseInt(req.params.id);
      const invoice = await invoiceService.updateInvoice(invoiceId, req.user.id, req.body);

      try {
        await auditLogService.writeLog({
          user_id: req.user.id,
          action: 'invoice_updated',
          entity_type: 'invoice',
          entity_id: invoiceId,
          details: { invoice_id: invoiceId, changed_fields: Object.keys(req.body) },
          ip_address: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        });
      } catch { /* audit log failure must not break the main action */ }

      res.status(200).json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteInvoice(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const invoiceId = parseInt(req.params.id);
      await invoiceService.deleteInvoice(invoiceId, req.user.id);

      try {
        await auditLogService.writeLog({
          user_id: req.user.id,
          action: 'invoice_deleted',
          entity_type: 'invoice',
          entity_id: invoiceId,
          details: { invoice_id: invoiceId },
          ip_address: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        });
      } catch { /* audit log failure must not break the main action */ }

      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMarketInsights(req: AuthRequest, res: Response): Promise<void> {
    try {
      const industry = req.query.industry as string | undefined;
      const insights = await invoiceService.getMarketInsights(industry);
      res.status(200).json(insights);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new InvoiceController();
