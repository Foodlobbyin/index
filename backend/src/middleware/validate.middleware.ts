import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Generic validation middleware factory.
 * Validates req.body against the provided Zod schema and returns 400 on failure.
 */
export const validate = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      res.status(400).json({ error: firstError?.message ?? 'Validation error' });
      return;
    }
    req.body = result.data;
    next();
  };

// ─── Auth schemas ────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  mobile_number: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const requestEmailOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const loginWithOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().min(1, 'OTP is required'),
});
