-- ============================================
-- GDPR: SELF-SERVICE DATA EXPORT + ACCOUNT DELETION
-- Adds the minimal marker needed for a member to delete/anonymize their own
-- account: deleted_at. Deliberately narrow scope — this does NOT introduce a
-- general soft-delete regime across every club_members query (that touches
-- ~30 call sites across services/controllers and is a larger, separate
-- change). It's only checked at the points where letting a "deleted" member
-- keep working would be a real bug: login, QR validation (check-in/purchase),
-- and the member list/detail/QR-lookup endpoints.
-- ============================================

ALTER TABLE club_members
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_club_members_deleted_at
  ON club_members(club_id)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN club_members.deleted_at IS 'Set when a member self-deletes via GDPR (see gdprService.deleteAndAnonymize). Row is kept (PII scrubbed) for referential integrity of visits/transactions/audit_logs — not a general soft-delete flag used everywhere.';
