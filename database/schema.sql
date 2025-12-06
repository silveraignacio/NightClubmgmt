-- ============================================
-- CLUB NIGHTLIFE SAAS - DATABASE SCHEMA
-- PostgreSQL Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== TABLA DE CLUBES (Multi-tenant) =====
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  owner_id UUID, -- Will reference users after that table is created
  logo_url VARCHAR(500),
  cover_image_url VARCHAR(500),
  description TEXT,
  website VARCHAR(500),
  stripe_account_id VARCHAR(255),
  current_plan VARCHAR(50) DEFAULT 'basic', -- basic, pro, premium
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  members_count INT DEFAULT 0,
  max_members INT DEFAULT 500,
  features JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'trialing', -- active, trialing, suspended, cancelled
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clubs_slug ON clubs(slug);
CREATE INDEX idx_clubs_status ON clubs(status);
CREATE INDEX idx_clubs_owner_id ON clubs(owner_id);

-- ===== TABLA DE USUARIOS DEL CLUB (Staff) =====
CREATE TABLE club_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'staff', -- admin, manager, bartender, doorman, staff
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(club_id, email)
);

CREATE INDEX idx_club_users_club_id ON club_users(club_id);
CREATE INDEX idx_club_users_email ON club_users(email);
CREATE INDEX idx_club_users_role ON club_users(role);

-- ===== TABLA DE TIERS DE MEMBRESÍA =====
CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  tier_name VARCHAR(100) NOT NULL, -- Bronze, Silver, Gold, VIP, Platinum
  description TEXT,
  color_hex VARCHAR(7) DEFAULT '#6B7280', -- Color for UI
  points_multiplier DECIMAL(3, 2) DEFAULT 1.00, -- 1.00x, 1.50x, 2.00x
  discount_percentage INT DEFAULT 0, -- Percentage discount (0-100)
  benefits JSONB DEFAULT '{}',
  entry_cost DECIMAL(10, 2) DEFAULT 0, -- Cost if paid membership
  points_required INT DEFAULT 0, -- Points needed to reach this tier
  duration_months INT, -- Duration in months (null = lifetime)
  stripe_price_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_membership_tiers_club_id ON membership_tiers(club_id);

-- ===== TABLA DE MIEMBROS DEL CLUB =====
CREATE TABLE club_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(20),
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  qr_code_id VARCHAR(255) UNIQUE NOT NULL,
  membership_type VARCHAR(50) DEFAULT 'free', -- free, bronze, silver, gold, vip, platinum
  membership_tier_id UUID REFERENCES membership_tiers(id),
  points_balance INT DEFAULT 0,
  total_visits INT DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  last_visit TIMESTAMP,
  profile_photo_url VARCHAR(500),
  date_of_birth DATE,
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  fcm_token VARCHAR(500), -- Firebase Cloud Messaging token
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(club_id, email)
);

CREATE INDEX idx_club_members_club_id ON club_members(club_id);
CREATE INDEX idx_club_members_qr_code_id ON club_members(qr_code_id);
CREATE INDEX idx_club_members_email ON club_members(email);
CREATE INDEX idx_club_members_membership_tier ON club_members(membership_tier_id);

-- ===== TABLA DE PROMOCIONES =====
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  promotion_name VARCHAR(255) NOT NULL,
  description TEXT,
  promotion_type VARCHAR(50) NOT NULL, -- percentage, fixed_amount, free_item, double_points, entry_discount
  discount_value DECIMAL(10, 2),
  discount_percentage INT,
  applicable_tiers JSONB DEFAULT '[]', -- Array of tier names or empty for all
  applies_to VARCHAR(50) DEFAULT 'all', -- drinks, entry, food, all
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  max_uses INT,
  uses_count INT DEFAULT 0,
  code VARCHAR(50),
  active BOOLEAN DEFAULT TRUE,
  created_by_user_id UUID REFERENCES club_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promotions_club_id ON promotions(club_id);
CREATE INDEX idx_promotions_active ON promotions(active);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_code ON promotions(code);

-- ===== TABLA DE VISITAS/ENTRADAS =====
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  member_id UUID REFERENCES club_members(id) ON DELETE SET NULL,
  qr_code_id VARCHAR(255),
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP,
  entry_method VARCHAR(50) DEFAULT 'qr_scan', -- qr_scan, manual, list_entry
  scanned_by_user_id UUID REFERENCES club_users(id),
  entry_type VARCHAR(50) DEFAULT 'free_entry', -- free_entry, paid_entry, vip_pass, promotional
  points_earned INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_visits_club_id ON visits(club_id);
CREATE INDEX idx_visits_member_id ON visits(member_id);
CREATE INDEX idx_visits_entry_time ON visits(entry_time);
CREATE INDEX idx_visits_qr_code_id ON visits(qr_code_id);

-- ===== TABLA DE TRANSACCIONES (COMPRAS) =====
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  member_id UUID REFERENCES club_members(id) ON DELETE SET NULL,
  qr_code_id VARCHAR(255),
  transaction_type VARCHAR(50) DEFAULT 'drink_sale', -- drink_sale, food_sale, entry_fee, table_service
  description VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  original_amount DECIMAL(10, 2) NOT NULL,
  discount_applied DECIMAL(10, 2) DEFAULT 0,
  points_earned INT DEFAULT 0,
  promotion_id UUID REFERENCES promotions(id),
  processed_by_user_id UUID REFERENCES club_users(id),
  device_id VARCHAR(255),
  payment_method VARCHAR(50) DEFAULT 'cash', -- cash, card, points, mixed
  stripe_charge_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed', -- completed, pending, refunded, cancelled
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_club_id ON transactions(club_id);
CREATE INDEX idx_transactions_member_id ON transactions(member_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ===== TABLA DE EVENTOS =====
CREATE TABLE events (
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
  registered_count INT DEFAULT 0,
  entry_price DECIMAL(10, 2) DEFAULT 0,
  vip_discount DECIMAL(10, 2) DEFAULT 0,
  special_promotions JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by_user_id UUID REFERENCES club_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_club_id ON events(club_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_active ON events(is_active);

-- ===== TABLA DE REGISTROS A EVENTOS =====
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES club_members(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attended BOOLEAN DEFAULT FALSE,
  attendance_time TIMESTAMP,
  UNIQUE(event_id, member_id)
);

CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_member_id ON event_registrations(member_id);

-- ===== TABLA DE NOTIFICACIONES =====
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  member_id UUID REFERENCES club_members(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- promotion, event, birthday, reward_unlocked, welcome, purchase
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  action_url VARCHAR(500),
  image_url VARCHAR(500),
  data JSONB DEFAULT '{}',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  clicked_at TIMESTAMP,
  delivery_method VARCHAR(50) DEFAULT 'push', -- push, email, sms
  delivery_status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, failed, pending
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_club_id ON notifications(club_id);
CREATE INDEX idx_notifications_member_id ON notifications(member_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);

-- ===== TABLA DE PUNTOS Y RECOMPENSAS =====
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  reward_name VARCHAR(255) NOT NULL,
  description TEXT,
  points_required INT NOT NULL,
  reward_type VARCHAR(50) DEFAULT 'discount', -- discount, free_item, free_entry, merchandise
  value DECIMAL(10, 2),
  image_url VARCHAR(500),
  quantity_available INT,
  quantity_redeemed INT DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rewards_club_id ON rewards(club_id);
CREATE INDEX idx_rewards_active ON rewards(is_active);

-- ===== TABLA DE RECOMPENSAS REDIMIDAS =====
CREATE TABLE redeemed_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES club_members(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP,
  points_spent INT NOT NULL,
  used_by_user_id UUID REFERENCES club_users(id),
  status VARCHAR(50) DEFAULT 'active', -- active, used, expired
  notes TEXT
);

CREATE INDEX idx_redeemed_rewards_reward_id ON redeemed_rewards(reward_id);
CREATE INDEX idx_redeemed_rewards_member_id ON redeemed_rewards(member_id);
CREATE INDEX idx_redeemed_rewards_status ON redeemed_rewards(status);

-- ===== TABLA DE BADGES/LOGROS =====
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  badge_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  badge_type VARCHAR(50) DEFAULT 'achievement', -- achievement, milestone, seasonal
  trigger_condition JSONB NOT NULL, -- {event: "visit_count", value: 1} or {event: "points_earned", value: 50}
  points_reward INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_badges_club_id ON badges(club_id);

-- ===== TABLA DE BADGES GANADAS POR MIEMBROS =====
CREATE TABLE member_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES club_members(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notified BOOLEAN DEFAULT FALSE,
  UNIQUE(member_id, badge_id)
);

CREATE INDEX idx_member_badges_member_id ON member_badges(member_id);
CREATE INDEX idx_member_badges_badge_id ON member_badges(badge_id);

-- ===== TABLA DE ANALYTICS/LOGS =====
CREATE TABLE analytics_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- visit, purchase, promotion_used, member_registered, reward_redeemed
  member_id UUID REFERENCES club_members(id) ON DELETE SET NULL,
  value DECIMAL(12, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_logs_club_id ON analytics_logs(club_id);
CREATE INDEX idx_analytics_logs_event_type ON analytics_logs(event_type);
CREATE INDEX idx_analytics_logs_created_at ON analytics_logs(created_at);

-- ===== TABLA DE SUSCRIPCIONES DEL CLUB =====
CREATE TABLE club_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255),
  plan_type VARCHAR(50) NOT NULL, -- basic, pro, premium
  status VARCHAR(50) NOT NULL, -- active, trialing, past_due, cancelled, unpaid
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_club_subscriptions_club_id ON club_subscriptions(club_id);
CREATE INDEX idx_club_subscriptions_stripe_id ON club_subscriptions(stripe_subscription_id);

-- ===== TABLA DE DISPOSITIVOS (Tablets Portero/Barra) =====
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL, -- door, bar, counter
  device_id VARCHAR(255) UNIQUE NOT NULL,
  location VARCHAR(255),
  api_key VARCHAR(255) UNIQUE NOT NULL,
  assigned_user_id UUID REFERENCES club_users(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP,
  last_ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_devices_club_id ON devices(club_id);
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_api_key ON devices(api_key);

-- ===== TABLA DE LEADERBOARDS =====
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES club_members(id) ON DELETE CASCADE,
  period VARCHAR(50) NOT NULL, -- daily, weekly, monthly, all_time
  rank INT NOT NULL,
  points INT NOT NULL,
  visits INT DEFAULT 0,
  spent DECIMAL(12, 2) DEFAULT 0,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(club_id, member_id, period, period_start)
);

CREATE INDEX idx_leaderboards_club_id_period ON leaderboards(club_id, period);
CREATE INDEX idx_leaderboards_period_dates ON leaderboards(period_start, period_end);
CREATE INDEX idx_leaderboards_rank ON leaderboards(rank);

-- ===== TABLA DE MENU ITEMS (Para Barra) =====
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- beers, cocktails, shots, wines, food, other
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  points_value INT DEFAULT 10, -- Points earned per purchase
  is_available BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_items_club_id ON menu_items(club_id);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);

-- ===== TABLA DE POINTS HISTORY =====
CREATE TABLE points_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES club_members(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  points_change INT NOT NULL, -- Can be positive or negative
  reason VARCHAR(255) NOT NULL, -- purchase, visit, reward_redeemed, promotion, manual_adjustment
  reference_id UUID, -- ID of related transaction, visit, etc
  reference_type VARCHAR(50), -- transaction, visit, reward, promotion
  balance_after INT NOT NULL,
  created_by_user_id UUID REFERENCES club_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_points_history_member_id ON points_history(member_id);
CREATE INDEX idx_points_history_club_id ON points_history(club_id);
CREATE INDEX idx_points_history_created_at ON points_history(created_at);

-- ===== Add foreign key for owner_id in clubs =====
ALTER TABLE clubs ADD CONSTRAINT fk_clubs_owner FOREIGN KEY (owner_id) REFERENCES club_users(id) ON DELETE SET NULL;

-- ===== Create triggers for updated_at =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_club_users_updated_at BEFORE UPDATE ON club_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_club_members_updated_at BEFORE UPDATE ON club_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== Insert default membership tiers (example data) =====
-- These can be created by each club after registration

-- ===== Comments for documentation =====
COMMENT ON TABLE clubs IS 'Multi-tenant clubs table - each club is isolated';
COMMENT ON TABLE club_users IS 'Staff members (admins, managers, bartenders, doormen) for each club';
COMMENT ON TABLE club_members IS 'Club customers/members with QR codes and loyalty points';
COMMENT ON TABLE membership_tiers IS 'Membership tier definitions (Bronze, Silver, Gold, VIP, etc.)';
COMMENT ON TABLE visits IS 'Entry logs when members scan QR at door';
COMMENT ON TABLE transactions IS 'Purchase transactions at bar/counter with automatic discounts';
COMMENT ON TABLE promotions IS 'Promotional campaigns and discounts';
COMMENT ON TABLE events IS 'Club events with registration';
COMMENT ON TABLE rewards IS 'Loyalty rewards that can be redeemed with points';
COMMENT ON TABLE badges IS 'Gamification badges/achievements';
COMMENT ON TABLE leaderboards IS 'Weekly/monthly member rankings';
COMMENT ON TABLE devices IS 'Registered tablets/devices for door/bar scanning';
COMMENT ON TABLE menu_items IS 'Bar menu items with prices';
COMMENT ON TABLE points_history IS 'Complete audit trail of point changes';
