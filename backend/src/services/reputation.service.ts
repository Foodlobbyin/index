import { ReputationScore, IncidentTypeBreakdown } from '../models/Reputation';
import reputationRepository from '../repositories/reputation.repository';

const INCIDENT_WEIGHTS: Record<string, number> = {
  FRAUD: 30,
  CONTRACT_BREACH: 25,
  PAYMENT_ISSUE: 20,
  QUALITY_ISSUE: 15,
  SERVICE_ISSUE: 10,
  OTHER: 5,
};

class ReputationService {
  calculateScore(counts: { incident_type: string; count: number }[]): number {
    let score = 100;
    for (const { incident_type, count } of counts) {
      const weight = INCIDENT_WEIGHTS[incident_type] ?? 0;
      score -= weight * count;
    }
    return Math.max(0, Math.min(100, score));
  }

  getLabel(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }

  async getReputationSummary(gstn: string): Promise<ReputationScore> {
    const counts = await reputationRepository.getIncidentCountsByGstn(gstn);
    const companyName = await reputationRepository.getCompanyNameByGstn(gstn);
    const score = this.calculateScore(counts);
    const label = this.getLabel(score);

    const breakdown: IncidentTypeBreakdown = {
      FRAUD: 0,
      CONTRACT_BREACH: 0,
      PAYMENT_ISSUE: 0,
      QUALITY_ISSUE: 0,
      SERVICE_ISSUE: 0,
      OTHER: 0,
    };
    let total_incidents = 0;
    for (const { incident_type, count } of counts) {
      if (incident_type in breakdown) {
        breakdown[incident_type as keyof IncidentTypeBreakdown] = count;
      }
      total_incidents += count;
    }

    return {
      company_gstn: gstn,
      company_name: companyName ?? gstn,
      reputation_score: score,
      label,
      total_incidents,
      breakdown,
    };
  }

  async recalculateAndPersist(gstn: string): Promise<number> {
    const counts = await reputationRepository.getIncidentCountsByGstn(gstn);
    const score = this.calculateScore(counts);
    await reputationRepository.updateScoreByGstn(gstn, score);
    return score;
  }
}

export default new ReputationService();
