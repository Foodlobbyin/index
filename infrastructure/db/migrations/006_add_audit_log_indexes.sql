-- Performance indexes for the audit_logs table.
-- Supports efficient queries by user+time and by entity type+id.

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created_at
    ON audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_entity_id
    ON audit_logs(entity_type, entity_id);
