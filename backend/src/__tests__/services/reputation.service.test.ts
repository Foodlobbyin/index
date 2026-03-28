import reputationService, { getRecencyDecay } from '../../services/reputation.service';
import reputationRepository from '../../repositories/reputation.repository';

jest.mock('../../repositories/reputation.repository');
jest.mock('../../config/database', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));

const monthsAgo = (months: number): Date => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
};

// ─────────────────────────────────────────────────────────────
// calculateScore (aggregate counts, no dates)
// ─────────────────────────────────────────────────────────────
describe('calculateScore', () => {
  it('returns 100 for no incidents', () => {
    expect(reputationService.calculateScore([])).toBe(100);
  });

  it('deducts 30 for one FRAUD incident → 70', () => {
    expect(
      reputationService.calculateScore([{ incident_type: 'FRAUD', count: 1 }])
    ).toBe(70);
  });

  it('deducts correctly for multiple types', () => {
    expect(
      reputationService.calculateScore([
        { incident_type: 'FRAUD', count: 1 },        // −30
        { incident_type: 'PAYMENT_ISSUE', count: 1 }, // −20
      ])
    ).toBe(50);
  });

  it('clamps to 0 when deductions exceed 100', () => {
    expect(
      reputationService.calculateScore([{ incident_type: 'FRAUD', count: 10 }])
    ).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// getLabel
// ─────────────────────────────────────────────────────────────
describe('getLabel', () => {
  it.each([
    [85, 'Excellent'],
    [80, 'Excellent'],
    [65, 'Good'],
    [60, 'Good'],
    [45, 'Fair'],
    [40, 'Fair'],
    [30, 'Poor'],
    [0,  'Poor'],
  ])('score %i → %s', (score, expected) => {
    expect(reputationService.getLabel(score)).toBe(expected);
  });
});

// ─────────────────────────────────────────────────────────────
// getRecencyDecay
// ─────────────────────────────────────────────────────────────
describe('getRecencyDecay', () => {
  it('returns 1.0 within 6 months', () => {
    expect(getRecencyDecay(monthsAgo(1))).toBe(1.0);
    expect(getRecencyDecay(monthsAgo(5))).toBe(1.0);
  });

  it('returns 0.75 between 6–12 months', () => {
    expect(getRecencyDecay(monthsAgo(7))).toBe(0.75);
    expect(getRecencyDecay(monthsAgo(11))).toBe(0.75);
  });

  it('returns 0.5 between 1–2 years', () => {
    expect(getRecencyDecay(monthsAgo(14))).toBe(0.5);
    expect(getRecencyDecay(monthsAgo(23))).toBe(0.5);
  });

  it('returns 0.25 for incidents older than 2 years', () => {
    expect(getRecencyDecay(monthsAgo(30))).toBe(0.25);
  });
});

// ─────────────────────────────────────────────────────────────
// calculateScoreWithDecay
// ─────────────────────────────────────────────────────────────
describe('calculateScoreWithDecay', () => {
  it('full weight for recent FRAUD → 70', () => {
    expect(
      reputationService.calculateScoreWithDecay([
        { incident_type: 'FRAUD', created_at: monthsAgo(1) },
      ])
    ).toBe(70); // 100 − 30×1.0
  });

  it('0.75 decay for 7-month-old FRAUD → 77.5', () => {
    expect(
      reputationService.calculateScoreWithDecay([
        { incident_type: 'FRAUD', created_at: monthsAgo(7) },
      ])
    ).toBeCloseTo(77.5); // 100 − 30×0.75
  });

  it('0.25 decay for 30-month-old FRAUD → 92.5', () => {
    expect(
      reputationService.calculateScoreWithDecay([
        { incident_type: 'FRAUD', created_at: monthsAgo(30) },
      ])
    ).toBeCloseTo(92.5); // 100 − 30×0.25
  });

  it('clamps to 0', () => {
    const incidents = Array(10).fill({ incident_type: 'FRAUD', created_at: monthsAgo(1) });
    expect(reputationService.calculateScoreWithDecay(incidents)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// getReputationByGstn
// ─────────────────────────────────────────────────────────────
describe('getReputationByGstn', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns score and breakdown for a GSTN with incidents', async () => {
    (reputationRepository.getIncidentsWithDatesByGstn as jest.Mock).mockResolvedValue([
      { incident_type: 'FRAUD',         created_at: monthsAgo(1) },
      { incident_type: 'QUALITY_ISSUE', created_at: monthsAgo(1) },
      { incident_type: 'QUALITY_ISSUE', created_at: monthsAgo(1) },
    ]);
    (reputationRepository.getCompanyNameByGstn as jest.Mock).mockResolvedValue('Test Vendor');

    const result = await reputationService.getReputationByGstn('27AAPFU0939F1ZV');

    expect(result.company_gstn).toBe('27AAPFU0939F1ZV');
    expect(result.company_name).toBe('Test Vendor');
    // 100 − 30 − 15 − 15 = 40
    expect(result.reputation_score).toBe(40);
    expect(result.label).toBe('Fair');
    expect(result.total_incidents).toBe(3);
    expect(result.breakdown.FRAUD).toBe(1);
    expect(result.breakdown.QUALITY_ISSUE).toBe(2);
  });

  it('returns score 100 when no incidents exist', async () => {
    (reputationRepository.getIncidentsWithDatesByGstn as jest.Mock).mockResolvedValue([]);
    (reputationRepository.getCompanyNameByGstn as jest.Mock).mockResolvedValue(null);

    const result = await reputationService.getReputationByGstn('27AAPFU0939F1ZV');

    expect(result.reputation_score).toBe(100);
    expect(result.label).toBe('Excellent');
    expect(result.total_incidents).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// getReputationByPhone
// ─────────────────────────────────────────────────────────────
describe('getReputationByPhone', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty array when phone is not found', async () => {
    (reputationRepository.getCompanyNamesByPhone as jest.Mock).mockResolvedValue([]);
    (reputationRepository.getCompanyNameByUserPhone as jest.Mock).mockResolvedValue(null);

    const result = await reputationService.getReputationByPhone('+919876543210');
    expect(result).toEqual([]);
  });

  it('returns reputation for a non-GSTN firm found via phone', async () => {
    (reputationRepository.getCompanyNamesByPhone as jest.Mock).mockResolvedValue(['Kumar Traders']);
    (reputationRepository.getCompanyNameByUserPhone as jest.Mock).mockResolvedValue(null);
    (reputationRepository.getIncidentsWithDatesByCompanyName as jest.Mock).mockResolvedValue([
      { incident_type: 'PAYMENT_ISSUE', created_at: monthsAgo(2), company_gstn: null },
    ]);

    const results = await reputationService.getReputationByPhone('+919876543210');

    expect(results).toHaveLength(1);
    expect(results[0].company_name).toBe('Kumar Traders');
    expect(results[0].company_gstn).toBeNull();
    expect(results[0].reputation_score).toBe(80); // 100 − 20×1.0
    expect(results[0].total_incidents).toBe(1);
  });

  it('returns reputation for a GSTN-registered firm found via phone', async () => {
    (reputationRepository.getCompanyNamesByPhone as jest.Mock).mockResolvedValue(['Spice Corp']);
    (reputationRepository.getCompanyNameByUserPhone as jest.Mock).mockResolvedValue(null);
    (reputationRepository.getIncidentsWithDatesByCompanyName as jest.Mock).mockResolvedValue([
      { incident_type: 'FRAUD', created_at: monthsAgo(1), company_gstn: '27AAPFU0939F1ZV' },
    ]);

    const results = await reputationService.getReputationByPhone('+919876543210');

    expect(results[0].company_gstn).toBe('27AAPFU0939F1ZV');
    expect(results[0].reputation_score).toBe(70);
  });

  it('deduplicates when phone appears in both contact_persons and users table', async () => {
    (reputationRepository.getCompanyNamesByPhone as jest.Mock).mockResolvedValue(['Kumar Traders']);
    // same name from users table — should be deduplicated
    (reputationRepository.getCompanyNameByUserPhone as jest.Mock).mockResolvedValue('Kumar Traders');
    (reputationRepository.getIncidentsWithDatesByCompanyName as jest.Mock).mockResolvedValue([]);

    const results = await reputationService.getReputationByPhone('+919876543210');
    expect(results).toHaveLength(1);
  });

  it('returns multiple results when phone is linked to multiple firms', async () => {
    (reputationRepository.getCompanyNamesByPhone as jest.Mock).mockResolvedValue(
      ['Firm A', 'Firm B']
    );
    (reputationRepository.getCompanyNameByUserPhone as jest.Mock).mockResolvedValue(null);
    (reputationRepository.getIncidentsWithDatesByCompanyName as jest.Mock).mockResolvedValue([]);

    const results = await reputationService.getReputationByPhone('+919876543210');
    expect(results).toHaveLength(2);
  });
});
