import pool from '../config/database';
import { AuditLog, AuditLogSearchParams, AuditLogSearchResult, WriteAuditLogInput } from '../models/AuditLog';

class AuditLogRepository {
  async writeLog(input: WriteAuditLogInput): Promise<void> {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.user_id ?? null,
        input.action,
        input.entity_type ?? null,
        input.entity_id ?? null,
        input.details ?? null,
        input.ip_address ?? null,
      ]
    );
  }

  async search(params: AuditLogSearchParams): Promise<AuditLogSearchResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const conditions: string[] = ['1=1'];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (params.incident_id !== undefined) {
      conditions.push(`incident_id = $${paramIndex++}`);
      values.push(params.incident_id);
    }

    if (params.moderator_id !== undefined) {
      conditions.push(`moderator_id = $${paramIndex++}`);
      values.push(params.moderator_id);
    }

    if (params.action !== undefined) {
      conditions.push(`action = $${paramIndex++}`);
      values.push(params.action);
    }

    if (params.date_from !== undefined) {
      conditions.push(`created_at >= $${paramIndex++}`);
      values.push(params.date_from);
    }

    if (params.date_to !== undefined) {
      conditions.push(`created_at <= $${paramIndex++}`);
      values.push(params.date_to);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    const query = `
      SELECT
        id,
        incident_id,
        moderator_id,
        action,
        notes,
        created_at,
        COUNT(*) OVER() AS total_count
      FROM incident_moderation_log
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const logs: AuditLog[] = result.rows.map((row: Record<string, unknown>): AuditLog => ({
      id: row.id as number,
      incident_id: row.incident_id as number,
      moderator_id: row.moderator_id as number | null,
      action: row.action as string,
      notes: row.notes as string | null,
      created_at: row.created_at as Date,
    }));

    return {
      logs,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }
}

export default new AuditLogRepository();
