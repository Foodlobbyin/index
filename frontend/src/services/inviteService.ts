import api from './api';

export interface InviteValidation {
  valid: boolean;
  invited_email?: string;
  type?: 'marketing' | 'member';
  error?: string;
}

export const inviteService = {
  async validate(token: string): Promise<InviteValidation> {
    try {
      const response = await api.get(`/invite/validate/${token}`);
      return response.data;
    } catch (err: any) {
      return { valid: false, error: err.response?.data?.error || 'Invalid invite link.' };
    }
  },

  async sendInvite(email: string): Promise<{ message: string }> {
    const response = await api.post('/invite/send', { email });
    return response.data;
  },

  async requestReinvite(token: string): Promise<{ message: string }> {
    const response = await api.post('/invite/request-reinvite', { token });
    return response.data;
  },
};
