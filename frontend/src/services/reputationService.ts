import api from './api';

export interface ReputationData {
  company_id: number;
  reputation_score: number;
  total_incidents: number;
  resolved_incidents: number;
  unresolved_incidents: number;
  last_updated: string | null;
}

export const reputationService = {
  async getReputation(companyId: number): Promise<ReputationData> {
    const response = await api.get(`/reputation/${companyId}`);
    return response.data;
  },
};
