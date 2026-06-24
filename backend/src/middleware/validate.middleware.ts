import type { Context, MiddlewareHandler } from 'hono';
import { z, ZodSchema } from 'zod';
import type { AppBindings } from '../types/env';

/**
 * Generic validation middleware factory.
 * Validates the JSON request body against the provided Zod schema and returns 400 on failure.
 * On success the parsed data is stored on the context via `c.set('validatedBody', ...)`.
 */
export const validate = (schema: ZodSchema): MiddlewareHandler<AppBindings> =>
  async (c: Context<AppBindings>, next) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = undefined;
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      return c.json({ error: firstError?.message ?? 'Validation error' }, 400);
    }

    c.set('validatedBody', result.data);
    await next();
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
