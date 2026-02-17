import api from './api';

export interface User {
  id: number;
  username: string;
  mobile_number?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  email_verified: boolean;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  mobile_number: string;
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
}

export interface EmailOTPLoginData {
  email: string;
  otp: string;
}

export const authService = {
  async register(data: RegisterData): Promise<{ user: User; token: string; message?: string }> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(data: LoginData): Promise<{ user: User; token: string }> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/request-password-reset', { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  async requestEmailOTP(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/request-email-otp', { email });
    return response.data;
  },

  async loginWithEmailOTP(data: EmailOTPLoginData): Promise<{ user: User; token: string }> {
    const response = await api.post('/auth/login-with-otp', data);
    return response.data;
  },

  async getProfile(): Promise<{ user: User }> {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
