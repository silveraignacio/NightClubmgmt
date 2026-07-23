-- ============================================
-- EMAIL VERIFICATION + PASSWORD RESET - Database Migration
-- Adds token-based email verification for self-registered members and a
-- unified password reset flow for both employees (club_users) and members
-- (club_members). See docs/architecture and BACKLOG.md P1.
-- ============================================

-- club_members already has an `email_verified BOOLEAN DEFAULT FALSE` column
-- (see database/schema.sql). Add the token + expiry needed to actually
-- fulfill a verification link.
ALTER TABLE club_members
  ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_club_members_email_verification_token
  ON club_members(email_verification_token)
  WHERE email_verification_token IS NOT NULL;

-- Single-use, short-lived password reset tokens shared by both user tables.
-- user_type disambiguates which table user_id refers to (club_users vs
-- club_members) since neither table's primary key space overlaps the other,
-- but a single generic name ("user_id") needs the type alongside it to be
-- unambiguous when joined against by hand.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('employee', 'member')),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id, user_type);

COMMENT ON TABLE password_reset_tokens IS 'Single-use password reset tokens for both club_users and club_members';
