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

/**
 * Returns a recency decay multiplier based on how old an incident is.
 *
 * - Last 6 months  → 1.00 (full weight)
 * - 6–12 months    → 0.75
 * - 1–2 years      → 0.50
 * - Older than 2 years → 0.25
 */
export function getRecencyDecay(incidentDate: Date): number {
  const now = new Date();
  const ageMs = now.getTime() - incidentDate.getTime();
  const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30.44); // average days/month

  if (ageMonths <= 6) return 1.0;
  if (ageMonths <= 12) return 0.75;
  if (ageMonths <= 24) return 0.5;
  return 0.25;
}

class ReputationService {
  /**
   * Calculate reputation score from incident type counts alone (no date info).
   * Kept for backward-compatibility with tests that pass aggregate counts.
   */
  calculateScore(counts: { incident_type: string; count: number }[]): number {
    let score = 100;
    for (const { incident_type, count } of counts) {
      const weight = INCIDENT_WEIGHTS[incident_type] ?? 0;
      score -= weight * count;
    }
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate reputation score with recency decay applied per incident.
   * Each incident's weight is multiplied by its decay factor before deduction.
   */
  calculateScoreWithDecay(
    incidents: { incident_type: string; created_at: Date }[]
  ): number {
    let score = 100;
    for (const incident of incidents) {
      const weight = INCIDENT_WEIGHTS[incident.incident_type] ?? 0;
      const decay = getRecencyDecay(incident.created_at);
      score -= weight * decay;
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

  /**
   * Recalculate reputation score for a company using per-incident recency decay,
   * then persist the result.
   */
  async recalculateAndPersist(gstn: string): Promise<number> {
    // Try to get per-incident data for decay-aware calculation
    const incidents = await reputationRepository.getIncidentsWithDatesByGstn(gstn);

    let score: number;
    if (incidents.length > 0) {
      score = this.calculateScoreWithDecay(incidents);
    } else {
      // Fallback: use aggregate counts (no date info available)
      const counts = await reputationRepository.getIncidentCountsByGstn(gstn);
      score = this.calculateScore(counts);
    }

    await reputationRepository.updateScoreByGstn(gstn, score);
    return score;
  }
}

export default new ReputationService();
