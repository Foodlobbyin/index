import { Response } from 'express';
import authService from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, email, password, first_name, last_name } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({ error: 'Username, email, and password are required' });
        return;
      }

      const result = await authService.register({ username, email, password, first_name, last_name });
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      const result = await authService.login({ username, password });
      res.status(200).json(result);
    } catch (error: any) {
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
