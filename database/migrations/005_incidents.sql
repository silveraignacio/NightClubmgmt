-- ============================================
-- SECURITY INCIDENTS - Database Migration
-- Gives the `security` (and `doorman`) roles something to actually use —
-- today they log in to an empty sidebar. See docs/architecture/rbac-matrix.md
-- "Incidents" section, which already documented this as admin/manager/security.
-- ============================================

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  incident_type VARCHAR(100) NOT NULL, -- altercation, medical, theft, noise_complaint, ejection, id_issue, overcapacity, other
  severity VARCHAR(20) NOT NULL DEFAULT 'low', -- low, medium, high, critical
  description TEXT NOT NULL,
  location VARCHAR(255),
  involved_members JSONB DEFAULT '[]',
  involved_staff JSONB DEFAULT '[]',
  action_taken TEXT,
  police_called BOOLEAN DEFAULT FALSE,
  ambulance_called BOOLEAN DEFAULT FALSE,
  reported_by UUID REFERENCES club_users(id) ON DELETE SET NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES club_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_club_id ON incidents(club_id);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_resolved ON incidents(club_id, resolved);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at);

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE incidents IS 'Security incident reports (RN-18 in .claude/rules/product-domain.md — critical severity should eventually notify owner/manager, not implemented yet)';
