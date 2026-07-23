-- ============================================
-- EMPLOYEE INVITATIONS - Database Migration
-- Lets an admin invite a new employee by email/role instead of the admin
-- creating the account (and knowing the password) directly. See
-- .claude/rules/rbac.md R1 (POST /employees/invite is admin-only) and
-- BACKLOG.md.
-- ============================================

CREATE TABLE IF NOT EXISTS employee_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'bartender', 'doorman', 'security', 'staff')),
  token VARCHAR(255) NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES club_users(id),
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_invitations_club ON employee_invitations(club_id);
CREATE INDEX IF NOT EXISTS idx_employee_invitations_token ON employee_invitations(token);
CREATE INDEX IF NOT EXISTS idx_employee_invitations_email ON employee_invitations(email);

COMMENT ON TABLE employee_invitations IS 'Pending/accepted invitations for new club_users, created by an admin';
