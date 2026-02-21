import incidentService from '../../services/incident.service';
import incidentRepository from '../../repositories/incident.repository';

jest.mock('../../repositories/incident.repository');
jest.mock('../../config/database', () => ({
  query: jest.fn(),
  default: { query: jest.fn() },
}));

const mockIncident = {
  id: 1,
  company_gstn: '27AAPFU0939F1ZV',
  company_name: 'Test Company',
  incident_type: 'FRAUD' as const,
  incident_date: new Date('2024-01-01'),
  incident_title: 'Test Incident',
  description: 'Test description',
  currency_code: 'INR',
  status: 'draft' as const,
  is_anonymous: false,
  reporter_id: 42,
  reporter_name: null,
  reporter_email: null,
  reporter_phone: null,
  moderator_notes: null,
  reviewed_by: null,
  reviewed_at: null,
  rejection_reason: null,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('IncidentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createIncident', () => {
    it('should create incident with valid data', async () => {
      (incidentRepository.create as jest.Mock).mockResolvedValue(mockIncident);

      const result = await incidentService.createIncident({
        company_gstn: '27AAPFU0939F1ZV',
        company_name: 'Test Company',
        incident_type: 'FRAUD',
        incident_date: '2024-01-01',
        incident_title: 'Test Incident',
        description: 'Test description',
      });

      expect(result).toEqual(mockIncident);
      expect(incidentRepository.create).toHaveBeenCalled();
    });

    it('should throw for invalid GSTN', async () => {
      await expect(
        incidentService.createIncident({
          company_gstn: 'INVALID',
          company_name: 'Test Company',
          incident_type: 'FRAUD',
          incident_date: '2024-01-01',
          incident_title: 'Test',
          description: 'Description',
        })
      ).rejects.toThrow('Invalid GSTN format');
    });

    it('should throw for missing required fields', async () => {
      await expect(
        incidentService.createIncident({
          company_gstn: '27AAPFU0939F1ZV',
          company_name: '',
          incident_type: 'FRAUD',
          incident_date: '2024-01-01',
          incident_title: 'Test',
          description: 'Description',
        })
      ).rejects.toThrow('Company name is required');
    });

    it('should throw for invalid incident type', async () => {
      await expect(
        incidentService.createIncident({
          company_gstn: '27AAPFU0939F1ZV',
          company_name: 'Test Company',
          incident_type: 'INVALID_TYPE' as any,
          incident_date: '2024-01-01',
          incident_title: 'Test',
          description: 'Description',
        })
      ).rejects.toThrow('Invalid incident type');
    });
  });

  describe('submitIncident', () => {
    it('should submit a draft incident', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue(mockIncident);
      (incidentRepository.updateStatus as jest.Mock).mockResolvedValue({ ...mockIncident, status: 'submitted' });

      const result = await incidentService.submitIncident(1, 42);
      expect(result.status).toBe('submitted');
    });

    it('should throw if incident is not in draft status', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue({ ...mockIncident, status: 'submitted' });

      await expect(incidentService.submitIncident(1, 42)).rejects.toThrow(
        'Only draft incidents can be submitted'
      );
    });

    it('should throw if incident not found', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(incidentService.submitIncident(99, 42)).rejects.toThrow('Incident not found');
    });
  });

  describe('getIncident', () => {
    it('should return incident with reporter details for the reporter', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue({
        ...mockIncident,
        is_anonymous: true,
        reporter_name: 'John Doe',
      });

      const result = await incidentService.getIncident(1, 42);
      expect(result.reporter_name).toBe('John Doe');
    });

    it('should hide reporter details for anonymous incidents when viewed by others', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue({
        ...mockIncident,
        is_anonymous: true,
        reporter_name: 'John Doe',
        reporter_email: 'john@example.com',
      });

      const result = await incidentService.getIncident(1, 99); // different user
      expect(result.reporter_name).toBeUndefined();
      expect(result.reporter_email).toBeUndefined();
    });
  });

  describe('deleteIncident', () => {
    it('should delete a draft incident by its owner', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue(mockIncident);
      (incidentRepository.delete as jest.Mock).mockResolvedValue(true);

      await expect(incidentService.deleteIncident(1, 42)).resolves.toBeUndefined();
    });

    it('should throw if user is not the reporter', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue(mockIncident);

      await expect(incidentService.deleteIncident(1, 99)).rejects.toThrow('Access denied');
    });

    it('should throw if incident is not a draft', async () => {
      (incidentRepository.findById as jest.Mock).mockResolvedValue({ ...mockIncident, status: 'approved' });

      await expect(incidentService.deleteIncident(1, 42)).rejects.toThrow(
        'Only draft incidents can be deleted'
      );
    });
  });
});
