import reputationService from '../../services/reputation.service';
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
});
