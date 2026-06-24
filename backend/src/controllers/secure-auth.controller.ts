/**
 * Secure Auth Controller
 * Handles HTTP requests for secure authentication with referral-based registration
 */

import type { Context } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import secureAuthService from '../services/secure-auth.service';
import auditLogService from '../services/auditLog.service';

export class SecureAuthController {
  /**
   * Register a new user with referral code
   * POST /api/auth/register
   */
  async register(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
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
      } = await c.req.json();

      // Get IP address and user agent
      const ip_address =
        c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
      const user_agent = c.req.header('user-agent');

      // Validate required fields
      if (!username) {
        return c.json({ error: 'Username is required' }, 400);
      }

      if (!phone_number) {
        return c.json({ error: 'Phone number is required' }, 400);
      }

      if (!email) {
        return c.json({ error: 'Email is required' }, 400);
      }

      if (!password) {
        return c.json({ error: 'Password is required' }, 400);
      }

      if (!confirm_password) {
        return c.json({ error: 'Confirm password is required' }, 400);
      }

      if (!gstn) {
        return c.json({ error: 'GSTN is required' }, 400);
      }

      if (!referral_code) {
        return c.json({ error: 'Referral code is required' }, 400);
      }

      const result = await secureAuthService.register(
        db,
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
        c.env.RECAPTCHA_SECRET_KEY,
        c.env.NODE_ENV,
        user_agent,
        captcha_token
      );

      try {
        await auditLogService.writeLog(db, {
          action: 'user_registered',
          entity_type: 'user',
          details: { username, email, gstn },
          ip_address,
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(result, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  /**
   * Verify OTP and activate account
   * POST /api/auth/verify-otp
   */
  async verifyOTP(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const { email, otp, captcha_token } = await c.req.json();

      if (!email) {
        return c.json({ error: 'Email is required' }, 400);
      }

      if (!otp) {
        return c.json({ error: 'OTP is required' }, 400);
      }

      // Get IP address
      const ip_address =
        c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';

      const result = await secureAuthService.verifyOTP(
        db,
        { email, otp, captcha_token },
        c.env.JWT_SECRET,
        c.env.RECAPTCHA_SECRET_KEY,
        c.env.NODE_ENV,
        ip_address
      );

      try {
        await auditLogService.writeLog(db, {
          user_id: result.user.id,
          action: 'email_verified',
          entity_type: 'user',
          entity_id: result.user.id,
          details: { email },
          ip_address,
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(result, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  /**
   * Request OTP (for resend or new request)
   * POST /api/auth/request-otp
   */
  async requestOTP(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const { email, captcha_token } = await c.req.json();

      if (!email) {
        return c.json({ error: 'Email is required' }, 400);
      }

      // Get IP address
      const ip_address =
        c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';

      const result = await secureAuthService.requestOTP(
        db,
        email,
        c.env.RECAPTCHA_SECRET_KEY,
        c.env.NODE_ENV,
        ip_address,
        captcha_token
      );

      return c.json(result, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  /**
   * Login with username and password
   * POST /api/auth/login
   */
  async login(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    const ip_address =
      c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
    let body: any;
    try {
      body = await c.req.json();
      const { username, password } = body;

      if (!username || !password) {
        return c.json({ error: 'Username and password are required' }, 400);
      }

      const result = await secureAuthService.login(db, { username, password }, c.env.JWT_SECRET);

      try {
        await auditLogService.writeLog(db, {
          user_id: result.user.id,
          action: 'user_login',
          entity_type: 'user',
          entity_id: result.user.id,
          details: { username: result.user.username },
          ip_address,
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(result, 200);
    } catch (error: any) {
      try {
        await auditLogService.writeLog(db, {
          action: 'user_login_failed',
          entity_type: 'user',
          details: { username: body?.username, reason: error.message },
          ip_address,
        });
      } catch { /* audit log failure must not break the main action */ }
      return c.json({ error: error.message }, 401);
    }
  }

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  async getProfile(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const result = await secureAuthService.getUserById(db, user.id);

      return c.json({ user: result }, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
}

export default new SecureAuthController();
