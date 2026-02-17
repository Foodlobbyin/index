import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../../services/authService';

// Mock axios instead of api
vi.mock('axios', () => ({
  default: {
    create: () => ({
      post: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('logout', () => {
    it('should clear localStorage on logout', () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'test' }));

      authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      const token = 'mock-token';
      localStorage.setItem('token', token);

      const result = authService.getToken();

      expect(result).toBe(token);
    });

    it('should return null if no token', () => {
      const result = authService.getToken();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if token exists', () => {
      localStorage.setItem('token', 'mock-token');

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false if no token', () => {
      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
