import { Response } from 'express';
import authService from '../services/auth.service';
import auditLogService from '../services/auditLog.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, mobile_number, email, password, first_name, last_name } = req.body;

      if (!username || !mobile_number || !email) {
        res.status(400).json({ error: 'Username, mobile number, and email are required' });
        return;
      }

      const result = await authService.register({ 
        username, 
        mobile_number, 
        email, 
        password, 
        first_name, 
        last_name 
      });

      try {
        await auditLogService.writeLog({
          user_id: result.user.id,
          action: 'user_registered',
          entity_type: 'user',
          entity_id: result.user.id,
          details: { username: result.user.username, email: result.user.email },
          ip_address: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        });
      } catch { /* audit log failure must not break the main action */ }

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    const ip_address = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      const result = await authService.login({ username, password });

      try {
        await auditLogService.writeLog({
          user_id: result.user.id,
          action: 'user_login',
          entity_type: 'user',
          entity_id: result.user.id,
          details: { username: result.user.username },
          ip_address,
        });
      } catch { /* audit log failure must not break the main action */ }

      res.status(200).json(result);
    } catch (error: any) {
      try {
        await auditLogService.writeLog({
          action: 'user_login_failed',
          entity_type: 'user',
          details: { username: req.body?.username, reason: error.message },
          ip_address,
        });
      } catch { /* audit log failure must not break the main action */ }
      res.status(401).json({ error: error.message });
    }
  }

  async verifyEmail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Verification token is required' });
        return;
      }

      const result = await authService.verifyEmail(token);

      try {
        await auditLogService.writeLog({
          action: 'email_verified',
          entity_type: 'user',
          ip_address: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        });
      } catch { /* audit log failure must not break the main action */ }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async requestPasswordReset(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const result = await authService.requestPasswordReset(email);

      try {
        await auditLogService.writeLog({
          action: 'password_reset_requested',
          entity_type: 'user',
          details: { email },
          ip_address: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        });
      } catch { /* audit log failure must not break the main action */ }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ error: 'Token and new password are required' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long' });
        return;
      }

      const result = await authService.resetPassword(token, newPassword);

      try {
        await auditLogService.writeLog({
          action: 'password_reset_completed',
          entity_type: 'user',
          ip_address: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        });
      } catch { /* audit log failure must not break the main action */ }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async requestEmailOTP(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const result = await authService.requestEmailOTP(email);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async loginWithEmailOTP(req: AuthRequest, res: Response): Promise<void> {
    const ip_address = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({ error: 'Email and OTP are required' });
        return;
      }

      const result = await authService.loginWithEmailOTP({ email, otp });

      try {
        await auditLogService.writeLog({
          user_id: result.user.id,
          action: 'user_login',
          entity_type: 'user',
          entity_id: result.user.id,
          details: { method: 'email_otp', email },
          ip_address,
        });
      } catch { /* audit log failure must not break the main action */ }

      res.status(200).json(result);
    } catch (error: any) {
      try {
        await auditLogService.writeLog({
          action: 'user_login_failed',
          entity_type: 'user',
          details: { method: 'email_otp', email: req.body?.email, reason: error.message },
          ip_address,
        });
      } catch { /* audit log failure must not break the main action */ }
      res.status(401).json({ error: error.message });
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await authService.getUserById(req.user.id);
      res.status(200).json({ user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AuthController();
