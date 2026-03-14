import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  requireTrustLevel,
  requireMinTrustLevel,
  requireMinTrustLevelNumeric,
} from '../../middleware/trustLevel.middleware';

function makeReq(trustLevel?: string): AuthRequest {
  return {
    user: trustLevel !== undefined ? { id: 1, username: 'user', trust_level: trustLevel } : undefined,
  } as unknown as AuthRequest;
}

function makeRes() {
  const state = { statusCode: 200, body: undefined as unknown };
  const res = {
    status(code: number) { state.statusCode = code; return res; },
    json(data: unknown) { state.body = data; return res; },
  } as unknown as Response;
  return { res, state };
}

describe('requireTrustLevel', () => {
  it('allows a user with an exact matching trust level', () => {
    const req = makeReq('moderator');
    const { res, state } = makeRes();
    const next = jest.fn();
    requireTrustLevel('moderator', 'admin')(req, res, next as unknown as NextFunction);
    expect(next).toHaveBeenCalled();
    expect(state.statusCode).toBe(200);
  });

  it('blocks a user whose trust level is not in the allowed list', () => {
    const req = makeReq('verified');
    const { res } = makeRes();
    const next = jest.fn();
    requireTrustLevel('moderator', 'admin')(req, res, next as unknown as NextFunction);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user is missing', () => {
    const req = makeReq(undefined);
    const { res, state } = makeRes();
    const next = jest.fn();
    requireTrustLevel('admin')(req, res, next as unknown as NextFunction);
    expect(next).not.toHaveBeenCalled();
    expect(state.statusCode).toBe(403);
  });

  it('returns 403 for an unknown trust level string', () => {
    const req = makeReq('superadmin');
    const { res, state } = makeRes();
    const next = jest.fn();
    requireTrustLevel('admin')(req, res, next as unknown as NextFunction);
    expect(next).not.toHaveBeenCalled();
    expect(state.statusCode).toBe(403);
  });
});

describe('requireMinTrustLevel (string)', () => {
  it('allows a user at exactly the minimum level', () => {
    const req = makeReq('moderator');
    const { res } = makeRes();
    const next = jest.fn();
    requireMinTrustLevel('moderator')(req, res, next as unknown as NextFunction);
    expect(next).toHaveBeenCalled();
  });

  it('allows a user above the minimum level', () => {
    const req = makeReq('admin');
    const { res } = makeRes();
    const next = jest.fn();
    requireMinTrustLevel('moderator')(req, res, next as unknown as NextFunction);
    expect(next).toHaveBeenCalled();
  });

  it('blocks a user below the minimum level', () => {
    const req = makeReq('verified');
    const { res, state } = makeRes();
    const next = jest.fn();
    requireMinTrustLevel('moderator')(req, res, next as unknown as NextFunction);
    expect(next).not.toHaveBeenCalled();
    expect(state.statusCode).toBe(403);
  });

  it('blocks an unauthenticated request (no user)', () => {
    const req = makeReq(undefined);
    const { res, state } = makeRes();
    const next = jest.fn();
    requireMinTrustLevel('new')(req, res, next as unknown as NextFunction);
    expect(next).not.toHaveBeenCalled();
    expect(state.statusCode).toBe(403);
  });

  it('returns error in { error, message } shape', () => {
    const req = makeReq('new');
    const { res, state } = makeRes();
    const next = jest.fn();
    requireMinTrustLevel('admin')(req, res, next as unknown as NextFunction);
    expect((state.body as any).error).toBe('Forbidden');
    expect((state.body as any).message).toContain('admin');
  });
});

describe('requireMinTrustLevelNumeric', () => {
  it('allows user with rank equal to minRank', () => {
    const req = makeReq('moderator'); // rank 3
    const { res } = makeRes();
    const next = jest.fn();
    requireMinTrustLevelNumeric(3)(req, res, next as unknown as NextFunction);
    expect(next).toHaveBeenCalled();
  });

  it('allows user with rank above minRank', () => {
    const req = makeReq('admin'); // rank 4
    const { res } = makeRes();
    const next = jest.fn();
    requireMinTrustLevelNumeric(3)(req, res, next as unknown as NextFunction);
    expect(next).toHaveBeenCalled();
  });

  it('blocks user with rank below minRank', () => {
    const req = makeReq('verified'); // rank 1
    const { res, state } = makeRes();
    const next = jest.fn();
    requireMinTrustLevelNumeric(3)(req, res, next as unknown as NextFunction);
    expect(next).not.toHaveBeenCalled();
    expect(state.statusCode).toBe(403);
  });

  it('blocks unauthenticated request', () => {
    const req = makeReq(undefined);
    const { res, state } = makeRes();
    const next = jest.fn();
    requireMinTrustLevelNumeric(1)(req, res, next as unknown as NextFunction);
    expect(next).not.toHaveBeenCalled();
    expect(state.statusCode).toBe(403);
  });

  it('correctly enforces admin-only (rank 4)', () => {
    const adminReq = makeReq('admin');
    const modReq = makeReq('moderator');
    const { res: r1 } = makeRes();
    const { res: r2, state: s2 } = makeRes();
    const next1 = jest.fn();
    const next2 = jest.fn();
    requireMinTrustLevelNumeric(4)(adminReq, r1, next1 as unknown as NextFunction);
    requireMinTrustLevelNumeric(4)(modReq, r2, next2 as unknown as NextFunction);
    expect(next1).toHaveBeenCalled();
    expect(next2).not.toHaveBeenCalled();
    expect(s2.statusCode).toBe(403);
  });
});
