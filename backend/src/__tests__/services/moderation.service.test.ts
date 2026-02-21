import moderationService from '../../services/moderation.service';
import incidentRepository from '../../repositories/incident.repository';
import { incidentResponseRepository, incidentPenaltyRepository } from '../../repositories/incidentResponse.repository';

jest.mock('../../repositories/incident.repository');
jest.mock('../../repositories/incidentResponse.repository');
jest.mock('../../config/database', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
  default: { query: jest.fn().mockResolvedValue({ rows: [] }) },
}));

const mockApprovedIncident = {
  id: 1,
  company_gstn: '27AAPFU0939F1ZV',
  company_name: 'Test Company',
  incident_type: 'FRAUD',
  status: 'approved',
  is_anonymous: false,
  reporter_id: 42,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockSubmittedIncident = {
  ...mockApprovedIncident,
  status: 'submitted',
};

describe('ModerationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('approveIncident', () => {
    it('should approve a submitted incident', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue(mockSubmittedIncident);
      (incidentRepository.updateStatus as jest.Mock).mockResolvedValue({ ...mockSubmittedIncident, status: 'approved' });

      const result = await moderationService.approveIncident(1, 10, 'Looks valid');
      expect(result.status).toBe('approved');
      expect(incidentRepository.updateStatus).toHaveBeenCalledWith(1, 'approved', expect.objectContaining({
        reviewed_by: 10,
        moderator_notes: 'Looks valid',
      }));
    });

    it('should throw if incident is already approved', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue(mockApprovedIncident);

      await expect(moderationService.approveIncident(1, 10)).rejects.toThrow(
        'Incident is not in a reviewable state'
      );
    });

    it('should throw if incident not found', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(moderationService.approveIncident(99, 10)).rejects.toThrow('Incident not found');
    });
  });

  describe('rejectIncident', () => {
    it('should reject a submitted incident with a reason', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue(mockSubmittedIncident);
      (incidentRepository.updateStatus as jest.Mock).mockResolvedValue({ ...mockSubmittedIncident, status: 'rejected' });

      const result = await moderationService.rejectIncident(1, 10, 'Insufficient evidence');
      expect(result.status).toBe('rejected');
    });

    it('should throw if rejection reason is missing', async () => {
      await expect(moderationService.rejectIncident(1, 10, '')).rejects.toThrow(
        'Rejection reason is required'
      );
    });
  });

  describe('addPenalty', () => {
    it('should add a penalty to an approved incident', async () => {
      const mockPenalty = { id: 1, incident_id: 1, penalty_amount: 5000, currency_code: 'INR', penalty_reason: 'Fraud', imposed_by: 10, created_at: new Date() };
      (incidentRepository.findById as jest.Mock).mockResolvedValue(mockApprovedIncident);
      (incidentPenaltyRepository.create as jest.Mock).mockResolvedValue(mockPenalty);

      const result = await moderationService.addPenalty({
        incident_id: 1,
        penalty_amount: 5000,
        penalty_reason: 'Fraud',
        imposed_by: 10,
      });
      expect(result).toEqual(mockPenalty);
    });

    it('should throw if incident is not approved', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue(mockSubmittedIncident);

      await expect(
        moderationService.addPenalty({ incident_id: 1, penalty_amount: 5000, penalty_reason: 'Fraud', imposed_by: 10 })
      ).rejects.toThrow('Penalties can only be added to approved incidents');
    });

    it('should throw for non-positive penalty amount', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue(mockApprovedIncident);

      await expect(
        moderationService.addPenalty({ incident_id: 1, penalty_amount: 0, penalty_reason: 'Fraud', imposed_by: 10 })
      ).rejects.toThrow('Penalty amount must be positive');
    });
  });

  describe('submitCompanyResponse', () => {
    it('should submit response for approved incident', async () => {
      const mockResponse = { id: 1, incident_id: 1, responder_gstn: '27AAPFU0939F1ZV', response_text: 'We disagree', created_at: new Date() };
      (incidentRepository.findById as jest.Mock).mockResolvedValue(mockApprovedIncident);
      (incidentResponseRepository.create as jest.Mock).mockResolvedValue(mockResponse);

      const result = await moderationService.submitCompanyResponse(1, '27AAPFU0939F1ZV', 'We disagree');
      expect(result).toEqual(mockResponse);
    });

    it('should throw if GSTN does not match incident company', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue(mockApprovedIncident);

      await expect(
        moderationService.submitCompanyResponse(1, '29AAACR5055K1Z5', 'Response')
      ).rejects.toThrow('You can only respond to incidents about your own company');
    });

    it('should throw if incident is not approved or resolved', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue(mockSubmittedIncident);

      await expect(
        moderationService.submitCompanyResponse(1, '27AAPFU0939F1ZV', 'Response')
      ).rejects.toThrow('Company responses can only be submitted for approved or resolved incidents');
    });
  });
});
