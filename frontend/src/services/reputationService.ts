import api from './api';

export interface ReputationScore {
  company_gstn: string | null;
  company_name: string;
  reputation_score: number;       // 0–100
  label: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  total_incidents: number;
  breakdown: {
    FRAUD: number;
    CONTRACT_BREACH: number;
    PAYMENT_ISSUE: number;
    QUALITY_ISSUE: number;
    SERVICE_ISSUE: number;
    OTHER: number;
  };
}

export const reputationService = {
  /**
   * Fetch reputation for a GSTN-registered company.
   * No auth required.
   */
  async getByGstn(gstn: string): Promise<ReputationScore> {
    const response = await api.get(`/reputation/by-gstn/${encodeURIComponent(gstn)}`);
    return response.data;
  },

  /**
   * Fetch reputation for one or more companies linked to a mobile/phone number.
   * Returns an array — one person may be associated with multiple firms.
   * Requires the user to be logged in.
   */
  async getByMobile(phone: string): Promise<ReputationScore[]> {
    const response = await api.get(`/reputation/by-mobile/${encodeURIComponent(phone)}`);
    return response.data.results;
  },
};
