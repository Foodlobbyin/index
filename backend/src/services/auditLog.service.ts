import type { DbClient } from '../config/database';
import auditLogRepository from '../repositories/auditLog.repository';
import { AuditLog, AuditLogSearchParams, AuditLogSearchResult, WriteAuditLogInput } from '../models/AuditLog';

class AuditLogService {
  async writeLog(db: DbClient, input: WriteAuditLogInput): Promise<void> {
    await auditLogRepository.writeLog(db, input);
  }

  async searchLogs(db: DbClient, params: AuditLogSearchParams): Promise<AuditLogSearchResult> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));

    return auditLogRepository.search(db, { ...params, page, limit });
  }

  async getLogsByIncident(db: DbClient, incidentId: number): Promise<AuditLog[]> {
    const result = await this.searchLogs(db, { incident_id: incidentId, limit: 100 });
    return result.logs;
  }
}

export default new AuditLogService();
