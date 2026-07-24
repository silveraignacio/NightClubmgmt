-- ============================================
-- VIP TABLES + RESERVATIONS - Database Migration
-- See docs/architecture/rbac-matrix.md "VIP".
-- ============================================

CREATE TABLE IF NOT EXISTS vip_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  table_name VARCHAR(100) NOT NULL,
  table_type VARCHAR(50) DEFAULT 'booth', -- booth, table, skybox, cabana, stage_side
  capacity INT NOT NULL DEFAULT 6,
  location VARCHAR(255),
  minimum_spend DECIMAL(10, 2) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vip_tables_club_id ON vip_tables(club_id);

CREATE TABLE IF NOT EXISTS vip_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES vip_tables(id) ON DELETE CASCADE,
  member_id UUID REFERENCES club_members(id) ON DELETE SET NULL,
  reservation_date DATE NOT NULL,
  guest_name VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20),
  party_size INT DEFAULT 2,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, seated, completed, cancelled, no_show
  special_requests TEXT,
  created_by UUID REFERENCES club_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vip_reservations_club_id ON vip_reservations(club_id);
CREATE INDEX IF NOT EXISTS idx_vip_reservations_date ON vip_reservations(club_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_vip_reservations_table_id ON vip_reservations(table_id);

CREATE TRIGGER update_vip_tables_updated_at
  BEFORE UPDATE ON vip_tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vip_reservations_updated_at
  BEFORE UPDATE ON vip_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE vip_tables IS 'VIP table/booth inventory for the venue';
COMMENT ON TABLE vip_reservations IS 'Reservations for VIP tables (deposit/payment tracking not implemented yet — see BACKLOG.md floor-plan item)';
