/**
 * Referral Routes
 * API endpoints for referral code management
 */

import { Router } from 'express';
import referralController from '../controllers/referral.controller';
import { authenticate } from '../middleware/auth.middleware';
import { createRateLimiter, authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Rate limiters
const referralRateLimiter = createRateLimiter(10, 15); // 10 requests per 15 minutes

/**
 * @openapi
 * /api/referrals/validate:
 *   post:
 *     tags:
 *       - Referrals
 *     summary: Validate referral code
 *     description: |
 *       Validate a referral code before registration. Checks:
 *       - Code exists and is active
 *       - Not expired
 *       - Under max usage limit
 *       - Email domain matches (if restricted)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: REF-ABC123XYZ
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Required if referral has email domain restriction
 *                 example: user@company.com
 *     responses:
 *       200:
 *         description: Referral code is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Referral code is valid
 *                 referral:
 *                   $ref: '#/components/schemas/Referral'
 *       400:
 *         description: Invalid, expired, or maxed out referral code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Referral code is expired
 *       429:
 *         description: Too many validation requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/validate', /* referralRateLimiter */ referralController.validateReferral);

/**
 * @openapi
 * /api/referrals:
 *   post:
 *     tags:
 *       - Referrals
 *     summary: Create referral code
 *     description: Create a new referral code (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - max_uses
 *               - expires_at
 *             properties:
 *               max_uses:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *                 description: Maximum number of times this code can be used
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-31T23:59:59Z"
 *                 description: Expiration date (must be in the future)
 *               allowed_email_domain:
 *                 type: string
 *                 example: company.com
 *                 description: Optional - Restrict to specific email domain
 *     responses:
 *       201:
 *         description: Referral code created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Referral'
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
 *       429:
 *         description: Too many create requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticate, /* referralRateLimiter */ referralController.createReferral);

/**
 * @openapi
 * /api/referrals/my-referrals:
 *   get:
 *     tags:
 *       - Referrals
 *     summary: Get my referral codes
 *     description: Retrieve all referral codes created by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's referral codes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Referral'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/my-referrals', authenticate, referralController.getMyReferrals);

/**
 * @openapi
 * /api/referrals/{code}/stats:
 *   get:
 *     tags:
 *       - Referrals
 *     summary: Get referral code statistics
 *     description: Get usage statistics for a specific referral code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Referral code
 *         example: REF-ABC123XYZ
 *     responses:
 *       200:
 *         description: Referral statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: REF-ABC123XYZ
 *                 used_count:
 *                   type: integer
 *                   example: 5
 *                 max_uses:
 *                   type: integer
 *                   example: 10
 *                 remaining_uses:
 *                   type: integer
 *                   example: 5
 *                 is_active:
 *                   type: boolean
 *                   example: true
 *                 expires_at:
 *                   type: string
 *                   format: date-time
 *                 is_expired:
 *                   type: boolean
 *                   example: false
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to view this referral
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Referral code not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:code/stats', authenticate, referralController.getReferralStats);

/**
 * @openapi
 * /api/referrals/{referralId}/deactivate:
 *   patch:
 *     tags:
 *       - Referrals
 *     summary: Deactivate referral code
 *     description: Deactivate a referral code (prevents further use)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: referralId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Referral ID
 *     responses:
 *       200:
 *         description: Referral deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Referral deactivated successfully
 *                 referral:
 *                   $ref: '#/components/schemas/Referral'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to modify this referral
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Referral not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:referralId/deactivate', authenticate, referralController.deactivateReferral);

/**
 * @openapi
 * /api/referrals/{referralId}/activate:
 *   patch:
 *     tags:
 *       - Referrals
 *     summary: Activate referral code
 *     description: Reactivate a previously deactivated referral code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: referralId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Referral ID
 *     responses:
 *       200:
 *         description: Referral activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Referral activated successfully
 *                 referral:
 *                   $ref: '#/components/schemas/Referral'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to modify this referral
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Referral not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:referralId/activate', authenticate, referralController.activateReferral);

export default router;
