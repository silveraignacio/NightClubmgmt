-- ============================================
-- AUDIT LOGS TABLE - Database Migration
-- Adds comprehensive audit logging for security and compliance
-- ============================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(100) NOT NULL,
  user_id UUID,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_club_id ON audit_logs(club_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_club_action_date
  ON audit_logs(club_id, action, created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all critical operations and security events';
COMMENT ON COLUMN audit_logs.action IS 'Action type (e.g., member.created, transaction.processed, security.unauthorized_access)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional contextual data in JSON format';
COMMENT ON COLUMN audit_logs.request_id IS 'Unique request identifier for tracing operations';

-- Create function to auto-cleanup old audit logs (optional)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '365 days';
END;
$$ LANGUAGE plpgsql;

-- You can schedule this function to run periodically using pg_cron or your application
-- Example (requires pg_cron extension):
-- SELECT cron.schedule('cleanup-audit-logs', '0 0 * * 0', 'SELECT cleanup_old_audit_logs()');
