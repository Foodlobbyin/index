/**
 * Secure Auth Routes
 * API endpoints for secure authentication with referral-based registration
 */

import { Router } from 'express';
import secureAuthController from '../controllers/secure-auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter, otpRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @openapi
 * /api/secure-auth/register:
 *   post:
 *     tags:
 *       - Secure Auth
 *     summary: Register with referral code (Enhanced)
 *     description: |
 *       Create a new user account with comprehensive validation:
 *       - Requires valid referral code
 *       - GSTN validation with checksum
 *       - Phone number validation (Indian format or E.164)
 *       - Password strength enforcement
 *       - reCAPTCHA verification
 *       - Email OTP verification required for activation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *               - phone_number
 *               - gstn
 *               - referral_code
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               phone_number:
 *                 type: string
 *                 description: Indian 10-digit or E.164 format
 *                 example: "9876543210"
 *               gstn:
 *                 type: string
 *                 pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
 *                 example: 27AAPFU0939F1ZV
 *               referral_code:
 *                 type: string
 *                 description: Valid referral code required
 *                 example: REF-ABC123XYZ
 *               recaptcha_token:
 *                 type: string
 *                 description: reCAPTCHA v3 token
 *     responses:
 *       201:
 *         description: Registration successful - OTP sent for verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registration successful. Please verify your email with the OTP sent.
 *                 userId:
 *                   type: integer
 *                   example: 123
 *       400:
 *         description: Validation error (invalid GSTN, phone, password, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists or referral code invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many registration attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authRateLimiter, secureAuthController.register);

/**
 * @openapi
 * /api/secure-auth/verify-otp:
 *   post:
 *     tags:
 *       - Secure Auth
 *     summary: Verify email OTP and activate account
 *     description: Verify the OTP sent to email and activate the user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               recaptcha_token:
 *                 type: string
 *                 description: reCAPTCHA v3 token
 *     responses:
 *       200:
 *         description: Account activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified and account activated successfully
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many verification attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-otp', otpRateLimiter, secureAuthController.verifyOTP);

/**
 * @openapi
 * /api/secure-auth/request-otp:
 *   post:
 *     tags:
 *       - Secure Auth
 *     summary: Request new OTP
 *     description: Resend OTP to email for account verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If an unverified account exists, a new OTP has been sent
 *       429:
 *         description: Too many OTP requests (max 5 per hour)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/request-otp', otpRateLimiter, secureAuthController.requestOTP);

/**
 * @openapi
 * /api/secure-auth/login:
 *   post:
 *     tags:
 *       - Secure Auth
 *     summary: Login with username and password
 *     description: Authenticate user (account must be activated via OTP)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials or account not activated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authRateLimiter, secureAuthController.login);

/**
 * @openapi
 * /api/secure-auth/profile:
 *   get:
 *     tags:
 *       - Secure Auth
 *     summary: Get authenticated user profile
 *     description: Retrieve profile information for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', authenticate, secureAuthController.getProfile);

export default router;
