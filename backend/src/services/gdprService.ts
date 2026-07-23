import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

class GdprService {
  /**
   * Export all of a member's own data (profile, visits, transactions, points
   * ledger, redeemed rewards) as a single JSON-serializable object.
   */
  async exportMemberData(memberId: string, clubId: string) {
    const [profile, visits, transactions, points, rewards] = await Promise.all([
      query(
        `SELECT id, club_id, email, full_name, phone, date_of_birth, qr_code_id,
                membership_type, points_balance, total_visits, total_spent,
                registration_date, email_verified
         FROM club_members
         WHERE id = $1 AND club_id = $2`,
        [memberId, clubId]
      ),
      query(
        `SELECT id, entry_time, exit_time, entry_method, entry_type, points_earned, notes
         FROM visits
         WHERE member_id = $1 AND club_id = $2
         ORDER BY entry_time DESC`,
        [memberId, clubId]
      ),
      query(
        `SELECT id, transaction_type, description, amount, payment_method, points_earned, status, transaction_date
         FROM transactions
         WHERE member_id = $1 AND club_id = $2
         ORDER BY transaction_date DESC`,
        [memberId, clubId]
      ),
      query(
        `SELECT id, points_change, reason, reference_id, reference_type, balance_after, created_at
         FROM points_history
         WHERE member_id = $1 AND club_id = $2
         ORDER BY created_at DESC`,
        [memberId, clubId]
      ),
      query(
        `SELECT rr.id, rr.reward_id, rr.points_spent, rr.redeemed_at, rr.status
         FROM redeemed_rewards rr
         JOIN rewards r ON rr.reward_id = r.id
         WHERE rr.member_id = $1 AND r.club_id = $2
         ORDER BY rr.redeemed_at DESC`,
        [memberId, clubId]
      ),
    ]);

    if (profile.rows.length === 0) {
      throw new AppError('Member not found', 404);
    }

    return {
      exportedAt: new Date().toISOString(),
      profile: profile.rows[0],
      visits: visits.rows,
      transactions: transactions.rows,
      pointsHistory: points.rows,
      redeemedRewards: rewards.rows,
    };
  }

  /**
   * Anonymize a member's PII in place and mark them deleted. The row itself
   * is kept (not hard-deleted) so visits/transactions/points_history/
   * audit_logs — all of which reference member_id — keep working; this is
   * deliberate, not an oversight (see RN-14 in docs/product/PRODUCT_FOUNDATION.md
   * and .claude/rules/product-domain.md).
   *
   * `deleted_at` is checked at login and QR validation (qrService,
   * membersController) so a deleted member can no longer authenticate or
   * check in/purchase — but they still appear (anonymized) in historical
   * listings, which is correct for audit/financial record integrity.
   */
  async deleteAndAnonymize(memberId: string, clubId: string) {
    const result = await query(
      `UPDATE club_members
       SET deleted_at = CURRENT_TIMESTAMP,
           email = 'deleted-' || id || '@deleted.local',
           full_name = 'Deleted Member',
           phone = NULL,
           profile_photo_url = NULL,
           date_of_birth = NULL,
           password_hash = NULL,
           fcm_token = NULL
       WHERE id = $1 AND club_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [memberId, clubId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Member not found or already deleted', 404);
    }

    return { id: result.rows[0].id };
  }
}

export const gdprService = new GdprService();
