import reputationService, { getRecencyDecay } from '../../services/reputation.service';
import reputationRepository from '../../repositories/reputation.repository';

jest.mock('../../repositories/reputation.repository');
jest.mock('../../config/database', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
  default: { query: jest.fn().mockResolvedValue({ rows: [] }) },
}));

describe('ReputationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateScore', () => {
    it('should return 100 for no incidents', () => {
      expect(reputationService.calculateScore([])).toBe(100);
    });

    it('should return 70 for one FRAUD incident (100-30=70)', () => {
      expect(
        reputationService.calculateScore([{ incident_type: 'FRAUD', count: 1 }])
      ).toBe(70);
    });

    it('should return 50 for one FRAUD and one PAYMENT_ISSUE incident (100-30-20=50)', () => {
      expect(
        reputationService.calculateScore([
          { incident_type: 'FRAUD', count: 1 },
          { incident_type: 'PAYMENT_ISSUE', count: 1 },
        ])
      ).toBe(50);
    });

    it('should clamp to 0 when total deductions exceed 100', () => {
      expect(
        reputationService.calculateScore([
          { incident_type: 'FRAUD', count: 4 },
        ])
      ).toBe(0);
    });
  });

  describe('getLabel', () => {
    it('should return Excellent for score 85', () => {
      expect(reputationService.getLabel(85)).toBe('Excellent');
    });

    it('should return Good for score 65', () => {
      expect(reputationService.getLabel(65)).toBe('Good');
    });

    it('should return Fair for score 45', () => {
      expect(reputationService.getLabel(45)).toBe('Fair');
    });

    it('should return Poor for score 30', () => {
      expect(reputationService.getLabel(30)).toBe('Poor');
    });
  });

  describe('getReputationSummary', () => {
    it('should return a ReputationScore with correct shape', async () => {
      const mockCounts = [
        { incident_type: 'FRAUD', count: 1 },
        { incident_type: 'QUALITY_ISSUE', count: 2 },
      ];
      (reputationRepository.getIncidentCountsByGstn as jest.Mock).mockResolvedValue(mockCounts);
      (reputationRepository.getCompanyNameByGstn as jest.Mock).mockResolvedValue('Test Vendor');

      const result = await reputationService.getReputationSummary('27AAPFU0939F1ZV');

      expect(result.company_gstn).toBe('27AAPFU0939F1ZV');
      expect(result.company_name).toBe('Test Vendor');
      expect(result.reputation_score).toBe(100 - 30 - (15 * 2)); // 40: 1 FRAUD(-30) + 2 QUALITY_ISSUE(-15 each)
      expect(result.label).toBe('Fair');
      expect(result.total_incidents).toBe(3);
      expect(result.breakdown.FRAUD).toBe(1);
      expect(result.breakdown.QUALITY_ISSUE).toBe(2);
    });
  });

  describe('getRecencyDecay', () => {
    const monthsAgo = (months: number): Date => {
      const d = new Date();
      d.setMonth(d.getMonth() - months);
      return d;
    };

    it('returns 1.0 for incidents within the last 6 months', () => {
      expect(getRecencyDecay(monthsAgo(1))).toBe(1.0);
      expect(getRecencyDecay(monthsAgo(5))).toBe(1.0);
    });

    it('returns 0.75 for incidents 6–12 months old', () => {
      expect(getRecencyDecay(monthsAgo(7))).toBe(0.75);
      expect(getRecencyDecay(monthsAgo(11))).toBe(0.75);
    });

    it('returns 0.5 for incidents 1–2 years old', () => {
      expect(getRecencyDecay(monthsAgo(14))).toBe(0.5);
      expect(getRecencyDecay(monthsAgo(23))).toBe(0.5);
    });

    it('returns 0.25 for incidents older than 2 years', () => {
      expect(getRecencyDecay(monthsAgo(30))).toBe(0.25);
    });
  });

  describe('calculateScoreWithDecay', () => {
    const monthsAgo = (months: number): Date => {
      const d = new Date();
      d.setMonth(d.getMonth() - months);
      return d;
    };

    it('applies full weight to recent incidents', () => {
      const incidents = [{ incident_type: 'FRAUD', created_at: monthsAgo(1) }];
      // FRAUD weight 30 × decay 1.0 = 30 deducted → score 70
      expect(reputationService.calculateScoreWithDecay(incidents)).toBe(70);
    });

    it('applies 0.75 decay to incidents 7 months old', () => {
      const incidents = [{ incident_type: 'FRAUD', created_at: monthsAgo(7) }];
      // 30 × 0.75 = 22.5 deducted → 77.5
      expect(reputationService.calculateScoreWithDecay(incidents)).toBeCloseTo(77.5);
    });

    it('applies 0.25 decay to incidents older than 2 years', () => {
      const incidents = [{ incident_type: 'FRAUD', created_at: monthsAgo(30) }];
      // 30 × 0.25 = 7.5 deducted → 92.5
      expect(reputationService.calculateScoreWithDecay(incidents)).toBeCloseTo(92.5);
    });

    it('clamps score to 0 when deductions exceed 100', () => {
      const incidents = Array(10).fill({ incident_type: 'FRAUD', created_at: monthsAgo(1) });
      expect(reputationService.calculateScoreWithDecay(incidents)).toBe(0);
    });
  });
});
