/**
 * Secure Auth Controller
 * Handles HTTP requests for secure authentication with referral-based registration
 */

import { Response } from 'express';
import secureAuthService from '../services/secure-auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class SecureAuthController {
  /**
   * Register a new user with referral code
   * POST /api/auth/register
   */
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        username,
        phone_number,
        email,
        password,
        confirm_password,
        first_name,
        last_name,
        gstn,
        referral_code,
        captcha_token,
      } = req.body;

      // Get IP address and user agent
      const ip_address = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const user_agent = req.headers['user-agent'];

      // Validate required fields
      if (!username) {
        res.status(400).json({ error: 'Username is required' });
        return;
      }

      if (!phone_number) {
        res.status(400).json({ error: 'Phone number is required' });
        return;
      }

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      if (!password) {
        res.status(400).json({ error: 'Password is required' });
        return;
      }

      if (!confirm_password) {
        res.status(400).json({ error: 'Confirm password is required' });
        return;
      }

      if (!gstn) {
        res.status(400).json({ error: 'GSTN is required' });
        return;
      }

      if (!referral_code) {
        res.status(400).json({ error: 'Referral code is required' });
        return;
      }

      const result = await secureAuthService.register(
        {
          username,
          phone_number,
          email,
          password,
          confirm_password,
          first_name,
          last_name,
          gstn,
          referral_code,
        },
        ip_address,
        user_agent,
        captcha_token
      );

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Verify OTP and activate account
   * POST /api/auth/verify-otp
   */
  async verifyOTP(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, otp, captcha_token } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      if (!otp) {
        res.status(400).json({ error: 'OTP is required' });
        return;
      }

      // Get IP address
      const ip_address = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

      const result = await secureAuthService.verifyOTP(
        { email, otp, captcha_token },
        ip_address
      );

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Request OTP (for resend or new request)
   * POST /api/auth/request-otp
   */
  async requestOTP(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, captcha_token } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      // Get IP address
      const ip_address = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

      const result = await secureAuthService.requestOTP(email, ip_address, captcha_token);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Login with username and password
   * POST /api/auth/login
   */
  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      const result = await secureAuthService.login({ username, password });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await secureAuthService.getUserById(req.user.id);

      res.status(200).json({ user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new SecureAuthController();
