/**
 * Secure Auth Controller
 * Handles HTTP requests for secure authentication with invite-based registration
 */

import type { Context } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import secureAuthService from '../services/secure-auth.service';
import auditLogService from '../services/auditLog.service';
import inviteTokenRepository from '../repositories/inviteToken.repository';

export class SecureAuthController {
  /**
   * Register a new user with invite token
   * POST /api/secure-auth/register
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
        invite_token,   // replaces referral_code
        captcha_token,
      } = await c.req.json();

      // Get IP address and user agent
      const ip_address =
        c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
      const user_agent = c.req.header('user-agent');

      // Validate required fields
      if (!username) return c.json({ error: 'Username is required' }, 400);
      if (!phone_number) return c.json({ error: 'Phone number is required' }, 400);
      if (!email) return c.json({ error: 'Email is required' }, 400);
      if (!password) return c.json({ error: 'Password is required' }, 400);
      if (!confirm_password) return c.json({ error: 'Confirm password is required' }, 400);
      if (!gstn) return c.json({ error: 'GSTN is required' }, 400);
      if (!invite_token) return c.json({ error: 'Invite token is required' }, 400);

      // ── Invite Token Validation ───────────────────────────────────────────
      const tokenRecord = await inviteTokenRepository.findByToken(db, invite_token);

      if (!tokenRecord) {
        return c.json({ error: 'Invalid invite link. Please request a new one.' }, 400);
      }
      if (tokenRecord.status === 'used') {
        return c.json({ error: 'This invite link has already been used.' }, 400);
      }
      if (tokenRecord.status === 'revoked') {
        return c.json({ error: 'This invite link has been revoked.' }, 400);
      }
      if (tokenRecord.status === 'expired' || new Date(tokenRecord.expires_at) < new Date()) {
        return c.json({ error: 'This invite link has expired. Please request a new one.' }, 400);
      }

      // Anti-impersonation: email must match the invited email
      if (tokenRecord.invited_email.toLowerCase() !== email.toLowerCase()) {
        return c.json(
          { error: 'This invite link was sent to a different email address.' },
          400
        );
      }

      // ── Determine registration_status from invite type ────────────────────
      // marketing invite → active immediately (after OTP verification)
      // member invite → pending_review (requires admin approval)
      const registration_status =
        tokenRecord.type === 'marketing' ? 'active' : 'pending_review';

      // ── Delegate to existing secure-auth service ──────────────────────────
      // Pass invite_token as referral_code for backward-compat with the service,
      // and include invite_token_id + registration_status as extra opts so the
      // service can persist them.
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
          referral_code: invite_token,   // service field kept for compat
          invite_token_id: tokenRecord.id,
          registration_status,
        },
        ip_address,
        c.env.RECAPTCHA_SECRET_KEY,
        c.env.NODE_ENV,
        c.env,
        user_agent,
        captcha_token
      );

      // Mark the invite token as used
      await inviteTokenRepository.markUsed(db, tokenRecord.id, result.user?.id ?? null);

      try {
        await auditLogService.writeLog(db, {
          action: 'user_registered',
          entity_type: 'user',
          details: {
            username,
            email,
            gstn,
            invite_type: tokenRecord.type,
            registration_status,
          },
          ip_address,
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(
        {
          ...result,
          registration_status,
          pending_review: registration_status === 'pending_review',
        },
        201
      );
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  /**
   * Verify OTP and activate account
   * POST /api/secure-auth/verify-otp
   */
  async verifyOTP(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const { email, otp, captcha_token } = await c.req.json();

      if (!email) return c.json({ error: 'Email is required' }, 400);
      if (!otp) return c.json({ error: 'OTP is required' }, 400);

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

      // If user is pending_review, override the normal login flow:
      // return success (email verified) but block access with pending flag.
      const userRow = await db.query(
        'SELECT registration_status FROM users WHERE email = $1',
        [email]
      );
      const reg_status = userRow.rows[0]?.registration_status;

      try {
        await auditLogService.writeLog(db, {
          user_id: result.user?.id,
          action: 'email_verified',
          entity_type: 'user',
          entity_id: result.user?.id,
          details: { email },
          ip_address,
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(
        {
          ...result,
          registration_status: reg_status,
          pending_review: reg_status === 'pending_review',
        },
        200
      );
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  /**
   * Request OTP (for resend or new request)
   * POST /api/secure-auth/request-otp
   */
  async requestOTP(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const { email, captcha_token } = await c.req.json();
      if (!email) return c.json({ error: 'Email is required' }, 400);

      const ip_address =
        c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';

      const result = await secureAuthService.requestOTP(
        db,
        email,
        c.env.RECAPTCHA_SECRET_KEY,
        c.env.NODE_ENV,
        c.env,
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
   * POST /api/secure-auth/login
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

      // Block pending_review users from logging in
      if (result.user?.registration_status === 'pending_review') {
        return c.json(
          {
            error: 'Your account is under review. You will be notified once approved.',
            pending_review: true,
            registration_status: 'pending_review',
          },
          403
        );
      }

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
   * GET /api/secure-auth/profile
   */
  async getProfile(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const result = await secureAuthService.getUserById(db, user.id);
      return c.json({ user: result }, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
}

export default new SecureAuthController();
