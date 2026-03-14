import { Request, Response, NextFunction } from 'express';
import {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  requestEmailOTPSchema,
  loginWithOTPSchema,
} from '../../middleware/validate.middleware';

function makeReq(body: Record<string, unknown>): Request {
  return { body } as unknown as Request;
}

function makeRes() {
  const state = { statusCode: 200, body: undefined as unknown };
  const res = {
    status(code: number) { state.statusCode = code; return res; },
    json(data: unknown) { state.body = data; return res; },
  } as unknown as Response;
  return { res, state };
}

function runValidation(schema: Parameters<typeof validate>[0], body: Record<string, unknown>) {
  const req = makeReq(body);
  const { res, state } = makeRes();
  const next = jest.fn();
  validate(schema)(req, res, next as unknown as NextFunction);
  return { req, statusCode: state.statusCode, body: state.body as any, next };
}

// ─── register ────────────────────────────────────────────────────────────────

describe('validate — registerSchema', () => {
  const valid = {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'SecurePass1!',
  };

  it('accepts a valid registration payload', () => {
    const { next, statusCode } = runValidation(registerSchema, valid);
    expect(next).toHaveBeenCalled();
    expect(statusCode).toBe(200);
  });

  it('rejects missing username', () => {
    const { next, statusCode, body } = runValidation(registerSchema, { ...valid, username: '' });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
    expect(body.error).toBeDefined();
  });

  it('rejects invalid email format', () => {
    const { next, statusCode, body } = runValidation(registerSchema, { ...valid, email: 'not-an-email' });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/email/i);
  });

  it('rejects missing email', () => {
    const { username, password } = valid;
    const { next, statusCode } = runValidation(registerSchema, { username, password });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
  });

  it('rejects password shorter than 8 characters', () => {
    const { next, statusCode, body } = runValidation(registerSchema, { ...valid, password: 'short1' });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/8/);
  });

  it('rejects missing password', () => {
    const { username, email } = valid;
    const { next, statusCode } = runValidation(registerSchema, { username, email });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
  });
});

// ─── login ───────────────────────────────────────────────────────────────────

describe('validate — loginSchema', () => {
  const valid = { username: 'john_doe', password: 'anypass' };

  it('accepts a valid login payload', () => {
    const { next } = runValidation(loginSchema, valid);
    expect(next).toHaveBeenCalled();
  });

  it('rejects missing username', () => {
    const { next, statusCode } = runValidation(loginSchema, { password: 'anypass' });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
  });

  it('rejects missing password', () => {
    const { next, statusCode } = runValidation(loginSchema, { username: 'john_doe' });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
  });

  it('rejects empty password string', () => {
    const { next, statusCode } = runValidation(loginSchema, { username: 'john_doe', password: '' });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
  });
});

// ─── forgot-password ─────────────────────────────────────────────────────────

describe('validate — forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    const { next } = runValidation(forgotPasswordSchema, { email: 'user@example.com' });
    expect(next).toHaveBeenCalled();
  });

  it('rejects an invalid email format', () => {
    const { next, statusCode, body } = runValidation(forgotPasswordSchema, { email: 'bad-email' });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/email/i);
  });

  it('rejects missing email', () => {
    const { next, statusCode } = runValidation(forgotPasswordSchema, {});
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
  });
});

// ─── reset-password ──────────────────────────────────────────────────────────

describe('validate — resetPasswordSchema', () => {
  const valid = { token: 'abc123token', newPassword: 'NewSecure1!' };

  it('accepts a valid reset-password payload', () => {
    const { next } = runValidation(resetPasswordSchema, valid);
    expect(next).toHaveBeenCalled();
  });

  it('rejects missing token', () => {
    const { next, statusCode } = runValidation(resetPasswordSchema, { newPassword: 'NewSecure1!' });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
  });

  it('rejects password shorter than 8 characters', () => {
    const { next, statusCode, body } = runValidation(resetPasswordSchema, { ...valid, newPassword: 'short' });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
    expect(body.error).toMatch(/8/);
  });

  it('rejects missing newPassword', () => {
    const { next, statusCode } = runValidation(resetPasswordSchema, { token: 'abc123token' });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
  });
});

// ─── request-email-otp ───────────────────────────────────────────────────────

describe('validate — requestEmailOTPSchema', () => {
  it('accepts a valid email', () => {
    const { next } = runValidation(requestEmailOTPSchema, { email: 'user@example.com' });
    expect(next).toHaveBeenCalled();
  });

  it('rejects invalid email', () => {
    const { next, statusCode } = runValidation(requestEmailOTPSchema, { email: 'invalid' });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
  });
});

// ─── login-with-otp ──────────────────────────────────────────────────────────

describe('validate — loginWithOTPSchema', () => {
  const valid = { email: 'user@example.com', otp: '123456' };

  it('accepts a valid payload', () => {
    const { next } = runValidation(loginWithOTPSchema, valid);
    expect(next).toHaveBeenCalled();
  });

  it('rejects invalid email', () => {
    const { next, statusCode } = runValidation(loginWithOTPSchema, { ...valid, email: 'bad' });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
  });

  it('rejects missing otp', () => {
    const { next, statusCode } = runValidation(loginWithOTPSchema, { email: 'user@example.com' });
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(400);
  });
});
