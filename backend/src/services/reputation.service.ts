import type { DbClient } from '../config/database';
import { ReputationScore, IncidentTypeBreakdown } from '../models/Reputation';
import reputationRepository from '../repositories/reputation.repository';

// ─── Weights ──────────────────────────────────────────────────────────────────
const INCIDENT_WEIGHTS: Record<string, number> = {
  FRAUD: 30,
  CONTRACT_BREACH: 25,
  PAYMENT_ISSUE: 20,
  QUALITY_ISSUE: 15,
  SERVICE_ISSUE: 10,
  OTHER: 5,
};

// ─── Recency decay ────────────────────────────────────────────────────────────
/**
 * Older incidents carry less weight:
 *   ≤ 6 months  → 1.00 (full)
 *   6–12 months → 0.75
 *   1–2 years   → 0.50
 *   > 2 years   → 0.25
 */
export function getRecencyDecay(incidentDate: Date): number {
  const ageMonths =
    (Date.now() - incidentDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (ageMonths <= 6)  return 1.00;
  if (ageMonths <= 12) return 0.75;
  if (ageMonths <= 24) return 0.50;
  return 0.25;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function emptyBreakdown(): IncidentTypeBreakdown {
  return { FRAUD: 0, CONTRACT_BREACH: 0, PAYMENT_ISSUE: 0, QUALITY_ISSUE: 0, SERVICE_ISSUE: 0, OTHER: 0 };
}

function scoreFromIncidents(
  incidents: { incident_type: string; created_at: Date }[]
): { score: number; breakdown: IncidentTypeBreakdown; total: number } {
  const breakdown = emptyBreakdown();
  let score = 100;

  for (const { incident_type, created_at } of incidents) {
    const weight = INCIDENT_WEIGHTS[incident_type] ?? 0;
    score -= weight * getRecencyDecay(created_at);
    if (incident_type in breakdown) {
      breakdown[incident_type as keyof IncidentTypeBreakdown]++;
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    breakdown,
    total: incidents.length,
  };
}

class ReputationService {

  // ─── Public scoring helpers (used by tests) ───────────────────────────────

  calculateScore(counts: { incident_type: string; count: number }[]): number {
    let score = 100;
    for (const { incident_type, count } of counts) {
      score -= (INCIDENT_WEIGHTS[incident_type] ?? 0) * count;
    }
    return Math.max(0, Math.min(100, score));
  }

  calculateScoreWithDecay(
    incidents: { incident_type: string; created_at: Date }[]
  ): number {
    return scoreFromIncidents(incidents).score;
  }

  getLabel(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }

  // ─── Path 1: Lookup by GSTN ───────────────────────────────────────────────

  async getReputationByGstn(db: DbClient, gstn: string): Promise<ReputationScore> {
    const incidents = await reputationRepository.getIncidentsWithDatesByGstn(db, gstn);
    const companyName = await reputationRepository.getCompanyNameByGstn(db, gstn);
    const { score, breakdown, total } = scoreFromIncidents(incidents);

    return {
      company_gstn: gstn,
      company_name: companyName ?? gstn,
      reputation_score: score,
      label: this.getLabel(score),
      total_incidents: total,
      breakdown,
    };
  }

  async recalculateAndPersistByGstn(db: DbClient, gstn: string): Promise<number> {
    const incidents = await reputationRepository.getIncidentsWithDatesByGstn(db, gstn);
    const score = scoreFromIncidents(incidents).score;
    await reputationRepository.updateScoreByGstn(db, gstn, score);
    return score;
  }

  // ─── Path 2: Lookup by mobile / phone ────────────────────────────────────
  /**
   * Resolves a phone number to one or more company names, then calculates
   * the reputation for each company found.
   *
   * Resolution order:
   *  1. contact_persons table — phone → company name (works for ALL firms,
   *     GSTN-registered or not)
   *  2. users + company_profiles — mobile_number / phone_number → company name
   *     (catches users who registered their own number)
   *
   * Returns an array because one person can be linked to multiple firms.
   */
  async getReputationByPhone(db: DbClient, phone: string): Promise<ReputationScore[]> {
    // Step 1: collect company names from both sources
    const namesFromContacts =
      await reputationRepository.getCompanyNamesByPhone(db, phone);

    const nameFromUserProfile =
      await reputationRepository.getCompanyNameByUserPhone(db, phone);

    // Deduplicate (case-insensitive)
    const seen = new Set<string>();
    const companyNames: string[] = [];

    for (const name of [...namesFromContacts, ...(nameFromUserProfile ? [nameFromUserProfile] : [])]) {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        companyNames.push(name);
      }
    }

    if (companyNames.length === 0) {
      return []; // phone number not found in any source
    }

    // Step 2: for each company, fetch incidents and score
    const results: ReputationScore[] = [];

    for (const companyName of companyNames) {
      const incidents =
        await reputationRepository.getIncidentsWithDatesByCompanyName(db, companyName);

      const { score, breakdown, total } = scoreFromIncidents(incidents);

      // Pick up GSTN if the incidents carry one (GSTN-registered firm found via mobile)
      const gstn =
        incidents.find((i) => i.company_gstn)?.company_gstn ?? null;

      results.push({
        company_gstn: gstn,
        company_name: companyName,
        reputation_score: score,
        label: this.getLabel(score),
        total_incidents: total,
        breakdown,
      });
    }

    return results;
  }

  // ─── Backward-compat aliases ──────────────────────────────────────────────

  /** @deprecated use getReputationByGstn */
  async getReputationSummary(db: DbClient, gstn: string): Promise<ReputationScore> {
    return this.getReputationByGstn(db, gstn);
  }

  /** @deprecated use recalculateAndPersistByGstn */
  async recalculateAndPersist(db: DbClient, gstn: string): Promise<number> {
    return this.recalculateAndPersistByGstn(db, gstn);
  }
}

export default new ReputationService();
