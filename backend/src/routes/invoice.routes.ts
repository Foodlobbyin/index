import { Router } from 'express';
import invoiceController from '../controllers/invoice.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/invoices - Create invoice (rate limited)
router.post('/', createLimiter, (req, res) => invoiceController.createInvoice(req, res));

// GET /api/invoices - Get all invoices for user's company
router.get('/', (req, res) => invoiceController.getInvoices(req, res));

// GET /api/invoices/:id - Get invoice by ID
router.get('/:id', (req, res) => invoiceController.getInvoiceById(req, res));

// PUT /api/invoices/:id - Update invoice
router.put('/:id', (req, res) => invoiceController.updateInvoice(req, res));

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', (req, res) => invoiceController.deleteInvoice(req, res));

export default router;
