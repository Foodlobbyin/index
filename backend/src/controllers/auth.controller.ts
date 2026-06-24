import type { Context } from 'hono';
import type { AppBindings } from '../types/env';
import { createDbClient } from '../config/database';
import authService from '../services/auth.service';
import auditLogService from '../services/auditLog.service';

export class AuthController {
  async register(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    const ip_address =
      c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
    try {
      const { username, mobile_number, email, password, first_name, last_name } =
        await c.req.json();

      if (!username || !mobile_number || !email) {
        return c.json({ error: 'Username, mobile number, and email are required' }, 400);
      }

      const result = await authService.register(
        db,
        {
          username,
          mobile_number,
          email,
          password,
          first_name,
          last_name,
        },
        c.env.JWT_SECRET
      );

      try {
        await auditLogService.writeLog(db, {
          user_id: result.user.id,
          action: 'user_registered',
          entity_type: 'user',
          entity_id: result.user.id,
          details: { username: result.user.username, email: result.user.email },
          ip_address,
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(result, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

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

      const result = await authService.login(db, { username, password }, c.env.JWT_SECRET);

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

  async verifyEmail(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const token = c.req.query('token');

      if (!token || typeof token !== 'string') {
        return c.json({ error: 'Verification token is required' }, 400);
      }

      const result = await authService.verifyEmail(db, token);

      try {
        await auditLogService.writeLog(db, {
          action: 'email_verified',
          entity_type: 'user',
          ip_address:
            c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(result, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  async requestPasswordReset(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const { email } = await c.req.json();

      if (!email) {
        return c.json({ error: 'Email is required' }, 400);
      }

      const result = await authService.requestPasswordReset(db, email);

      try {
        await auditLogService.writeLog(db, {
          action: 'password_reset_requested',
          entity_type: 'user',
          details: { email },
          ip_address:
            c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(result, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  async resetPassword(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const { token, newPassword } = await c.req.json();

      if (!token || !newPassword) {
        return c.json({ error: 'Token and new password are required' }, 400);
      }

      if (newPassword.length < 8) {
        return c.json({ error: 'Password must be at least 8 characters' }, 400);
      }

      const result = await authService.resetPassword(db, token, newPassword);

      try {
        await auditLogService.writeLog(db, {
          action: 'password_reset_completed',
          entity_type: 'user',
          ip_address:
            c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(result, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  async requestEmailOTP(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const { email } = await c.req.json();

      if (!email) {
        return c.json({ error: 'Email is required' }, 400);
      }

      const result = await authService.requestEmailOTP(db, email);
      return c.json(result, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  async loginWithEmailOTP(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    const ip_address =
      c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
    let body: any;
    try {
      body = await c.req.json();
      const { email, otp } = body;

      if (!email || !otp) {
        return c.json({ error: 'Email and OTP are required' }, 400);
      }

      const result = await authService.loginWithEmailOTP(db, { email, otp }, c.env.JWT_SECRET);

      try {
        await auditLogService.writeLog(db, {
          user_id: result.user.id,
          action: 'user_login',
          entity_type: 'user',
          entity_id: result.user.id,
          details: { method: 'email_otp', email },
          ip_address,
        });
      } catch { /* audit log failure must not break the main action */ }

      return c.json(result, 200);
    } catch (error: any) {
      try {
        await auditLogService.writeLog(db, {
          action: 'user_login_failed',
          entity_type: 'user',
          details: { method: 'email_otp', email: body?.email, reason: error.message },
          ip_address,
        });
      } catch { /* audit log failure must not break the main action */ }
      return c.json({ error: error.message }, 401);
    }
  }

  async getProfile(c: Context<AppBindings>): Promise<Response> {
    const db = createDbClient(c.env.DATABASE_URL);
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const result = await authService.getUserById(db, user.id);
      return c.json({ user: result }, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
}

export default new AuthController();
