import { Router } from 'express';
import invoiceController from '../controllers/invoice.controller';

const router = Router();

// GET /api/insights - Get market insights (public route with optional industry filter)
router.get('/', (req, res) => invoiceController.getMarketInsights(req, res));

export default router;
