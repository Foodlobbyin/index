import { Router } from 'express';
import companyController from '../controllers/company.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /api/company:
 *   post:
 *     tags:
 *       - Company
 *     summary: Create company profile
 *     description: Create a new company profile for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - industry
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acme Corporation
 *               industry:
 *                 type: string
 *                 example: Technology
 *               revenue:
 *                 type: number
 *                 format: decimal
 *                 example: 5000000.00
 *               employees:
 *                 type: integer
 *                 example: 50
 *               address:
 *                 type: string
 *                 example: 123 Main Street
 *               city:
 *                 type: string
 *                 example: San Francisco
 *               country:
 *                 type: string
 *                 example: USA
 *               website:
 *                 type: string
 *                 format: uri
 *                 example: https://acme.com
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Company already exists for this user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many create requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', /* createLimiter */ (req, res) => companyController.createCompany(req, res));

/**
 * @openapi
 * /api/company:
 *   get:
 *     tags:
 *       - Company
 *     summary: Get user's company profile
 *     description: Retrieve the company profile for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Company profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (req, res) => companyController.getCompany(req, res));

/**
 * @openapi
 * /api/company/{id}:
 *   put:
 *     tags:
 *       - Company
 *     summary: Update company profile
 *     description: Update an existing company profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acme Corporation
 *               industry:
 *                 type: string
 *                 example: Technology
 *               revenue:
 *                 type: number
 *                 format: decimal
 *                 example: 6000000.00
 *               employees:
 *                 type: integer
 *                 example: 60
 *               address:
 *                 type: string
 *                 example: 456 Market Street
 *               city:
 *                 type: string
 *                 example: San Francisco
 *               country:
 *                 type: string
 *                 example: USA
 *               website:
 *                 type: string
 *                 format: uri
 *                 example: https://acme.com
 *     responses:
 *       200:
 *         description: Company updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to update this company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', (req, res) => companyController.updateCompany(req, res));

/**
 * @openapi
 * /api/company/{id}:
 *   delete:
 *     tags:
 *       - Company
 *     summary: Delete company profile
 *     description: Delete a company profile (requires ownership)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Company deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to delete this company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', (req, res) => companyController.deleteCompany(req, res));

export default router;
