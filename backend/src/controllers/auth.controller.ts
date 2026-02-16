import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, firstName, lastName } = req.body;
      const user = await AuthService.register(username, email, password, firstName, lastName);
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      const { user, token } = await AuthService.login(username, password);
      res.status(200).json({ message: 'Login successful', user, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const user = await AuthService.getUserById(userId);
      res.status(200).json({ user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}