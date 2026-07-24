-- ============================================
-- GUEST LISTS - Database Migration
-- See docs/architecture/rbac-matrix.md "Guest Lists". Distinct from
-- event_attendance (006_events.sql): a guest list is names added ahead of
-- time (by staff, on behalf of the club/promoter) for reduced/free entry;
-- check-in marks who actually showed up against that pre-approved list.
-- ============================================

CREATE TABLE IF NOT EXISTS guest_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  list_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  entry_type VARCHAR(50) DEFAULT 'free_entry', -- free_entry, reduced, vip
  max_guests INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES club_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guest_lists_club_id ON guest_lists(club_id);
CREATE INDEX IF NOT EXISTS idx_guest_lists_event_date ON guest_lists(club_id, event_date);

CREATE TABLE IF NOT EXISTS guest_list_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_list_id UUID NOT NULL REFERENCES guest_lists(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  member_id UUID REFERENCES club_members(id) ON DELETE SET NULL,
  guest_name VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20),
  plus_ones INT DEFAULT 0,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP,
  checked_in_by UUID REFERENCES club_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guest_list_entries_list_id ON guest_list_entries(guest_list_id);
CREATE INDEX IF NOT EXISTS idx_guest_list_entries_club_id ON guest_list_entries(club_id);

CREATE TRIGGER update_guest_lists_updated_at
  BEFORE UPDATE ON guest_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE guest_lists IS 'Pre-approved guest lists for an event/night (reduced or free entry)';
COMMENT ON TABLE guest_list_entries IS 'Individual guests on a guest list, checked in at the door';
