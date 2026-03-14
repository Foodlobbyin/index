import auditLogRepository from '../repositories/auditLog.repository';
import { AuditLog, AuditLogSearchParams, AuditLogSearchResult, WriteAuditLogInput } from '../models/AuditLog';

class AuditLogService {
  async writeLog(input: WriteAuditLogInput): Promise<void> {
    await auditLogRepository.writeLog(input);
  }

  async searchLogs(params: AuditLogSearchParams): Promise<AuditLogSearchResult> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));

    return auditLogRepository.search({ ...params, page, limit });
  }

  async getLogsByIncident(incidentId: number): Promise<AuditLog[]> {
    const result = await this.searchLogs({ incident_id: incidentId, limit: 100 });
    return result.logs;
  }
}

export default new AuditLogService();
