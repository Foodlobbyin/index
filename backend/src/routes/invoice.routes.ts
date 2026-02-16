import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();

router.post('/', authMiddleware, (req, res) => InvoiceController.createInvoice(req, res));outer.get('/', (req, res) => InvoiceController.getInvoices(req, res));
router.get('/:id', (req, res) => InvoiceController.getInvoiceById(req, res));
router.put('/:id', authMiddleware, (req, res) => InvoiceController.updateInvoice(req, res));
router.delete('/:id', authMiddleware, (req, res) => InvoiceController.deleteInvoice(req, res));

export default router;