import auditLogService from '../../services/auditLog.service';
import auditLogRepository from '../../repositories/auditLog.repository';

jest.mock('../../repositories/auditLog.repository');
jest.mock('../../config/database', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
  default: { query: jest.fn().mockResolvedValue({ rows: [] }) },
}));

const mockSearch = auditLogRepository.search as jest.Mock;

describe('AuditLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchLogs', () => {
    it('should return result from repository with no params', async () => {
      const mockResult = {
        logs: [],
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0,
      };
      mockSearch.mockResolvedValue(mockResult);

      const result = await auditLogService.searchLogs({});

      expect(mockSearch).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(result).toEqual(mockResult);
    });

    it('should clamp limit to 100 if over 100', async () => {
      const mockResult = {
        logs: [],
        total: 0,
        page: 1,
        limit: 100,
        total_pages: 0,
      };
      mockSearch.mockResolvedValue(mockResult);

      await auditLogService.searchLogs({ limit: 500 });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
    });

    it('should clamp page to 1 if below 1', async () => {
      const mockResult = {
        logs: [],
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0,
      };
      mockSearch.mockResolvedValue(mockResult);

      await auditLogService.searchLogs({ page: -5 });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    it('should pass incident_id filter through to repository', async () => {
      const mockResult = {
        logs: [],
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0,
      };
      mockSearch.mockResolvedValue(mockResult);

      await auditLogService.searchLogs({ incident_id: 42 });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ incident_id: 42 }));
    });
  });

  describe('getLogsByIncident', () => {
    it('should call searchLogs with correct incident_id and return logs array', async () => {
      const mockLogs = [
        { id: 1, incident_id: 7, moderator_id: 2, action: 'APPROVE', notes: null, created_at: new Date() },
      ];
      const mockResult = {
        logs: mockLogs,
        total: 1,
        page: 1,
        limit: 100,
        total_pages: 1,
      };
      mockSearch.mockResolvedValue(mockResult);

      const result = await auditLogService.getLogsByIncident(7);

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ incident_id: 7, limit: 100 }));
      expect(result).toEqual(mockLogs);
    });
  });
});
