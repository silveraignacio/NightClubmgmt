-- ============================================
-- EVENTS - Database Migration
-- Nightly/special events. See docs/architecture/rbac-matrix.md "Events".
-- ============================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  event_type VARCHAR(100) DEFAULT 'special_event', -- ladies_night, dj_night, karaoke, special_event, tournament
  featured_image_url VARCHAR(500),
  capacity INT,
  attendee_count INT DEFAULT 0,
  entry_price DECIMAL(10, 2) DEFAULT 0,
  vip_discount DECIMAL(10, 2) DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by_user_id UUID REFERENCES club_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(club_id, is_active);

-- Attendance: who actually showed up (marked by staff), distinct from a
-- guest-list/RSVP concept (which is a separate, not-yet-built feature).
CREATE TABLE IF NOT EXISTS event_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES club_members(id) ON DELETE CASCADE,
  marked_by UUID REFERENCES club_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_club_id ON event_attendance(club_id);

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE events IS 'Club events (nightly specials, ladies night, etc.)';
COMMENT ON TABLE event_attendance IS 'Members marked as attended a given event by staff (admin/manager/bartender)';
