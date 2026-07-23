import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query, getClient } from '../config/database';
import { catchAsync, AppError } from '../utils/errorHandler';
import { auditService, AuditActionType } from '../services/auditService';

// Columns exposed for a reward catalog entry.
const REWARD_COLUMNS = `
  id, club_id, reward_name, description, points_required, reward_type,
  value, image_url, quantity_available, quantity_redeemed,
  valid_from, valid_until, is_active, created_at, updated_at
`;

/**
 * GET /clubs/:clubId/rewards
 * List active, currently-valid rewards for a club. Available to any authenticated
 * club user or member (it is just a catalog); tenant scoping is enforced by
 * ensureClubAccess upstream.
 */
export const getClubRewards = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId;

  const result = await query(
    `SELECT ${REWARD_COLUMNS}
     FROM rewards
     WHERE club_id = $1
       AND is_active = true
       AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP)
       AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)
       AND (quantity_available IS NULL OR quantity_redeemed < quantity_available)
     ORDER BY points_required ASC, reward_name ASC`,
    [clubId]
  );

  res.status(200).json({
    status: 'success',
    data: { rewards: result.rows },
  });
});

/**
 * POST /clubs/:clubId/rewards/:rewardId/redeem
 * Redeem a reward for the currently authenticated member (req.user.id). This only
 * ever redeems for the caller — no memberId is accepted from the body. The points
 * check + decrement is done in a single conditional UPDATE to avoid a race where a
 * member could spend more points than they hold. The reward-quantity increment and
 * the redeemed_rewards insert run inside the same transaction for atomicity.
 */
export const redeemReward = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId;
  const { rewardId } = req.params;
  const memberId = req.user!.id;

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Lock the reward row so concurrent redemptions can't oversell limited quantity.
    const rewardResult = await client.query(
      `SELECT id, reward_name, points_required, reward_type, value,
              quantity_available, quantity_redeemed, valid_until, is_active
       FROM rewards
       WHERE id = $1 AND club_id = $2
       FOR UPDATE`,
      [rewardId, clubId]
    );

    if (rewardResult.rows.length === 0) {
      throw new AppError('Reward not found', 404);
    }

    const reward = rewardResult.rows[0];

    if (!reward.is_active) {
      throw new AppError('This reward is no longer available', 400);
    }

    if (reward.valid_until && new Date(reward.valid_until) < new Date()) {
      throw new AppError('This reward has expired', 400);
    }

    if (
      reward.quantity_available !== null &&
      reward.quantity_redeemed >= reward.quantity_available
    ) {
      throw new AppError('This reward is out of stock', 400);
    }

    const pointsCost = reward.points_required;

    // Atomic points check + decrement: rowCount === 0 means insufficient points
    // (or the member doesn't belong to this club).
    const balanceResult = await client.query(
      `UPDATE club_members
       SET points_balance = points_balance - $1
       WHERE id = $2 AND club_id = $3 AND points_balance >= $1
       RETURNING points_balance`,
      [pointsCost, memberId, clubId]
    );

    if (balanceResult.rowCount === 0) {
      // Distinguish "member not found" from "not enough points".
      const memberExists = await client.query(
        'SELECT id FROM club_members WHERE id = $1 AND club_id = $2',
        [memberId, clubId]
      );
      if (memberExists.rows.length === 0) {
        throw new AppError('Member not found', 404);
      }
      throw new AppError('Insufficient points', 400);
    }

    const newBalance = balanceResult.rows[0].points_balance;

    // Reserve the reward inventory.
    await client.query(
      'UPDATE rewards SET quantity_redeemed = quantity_redeemed + 1 WHERE id = $1',
      [rewardId]
    );

    // Record the redemption.
    const redemptionResult = await client.query(
      `INSERT INTO redeemed_rewards (reward_id, member_id, points_spent, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, reward_id, member_id, points_spent, status, redeemed_at, used_at`,
      [rewardId, memberId, pointsCost]
    );

    // Ledger entry: the UPDATE above already moved points_balance, but every
    // change must also be traceable in points_history or the balance can't be
    // reconciled against the ledger (see .claude/rules/loyalty.md).
    await client.query(
      `INSERT INTO points_history (member_id, club_id, points_change, reason, reference_id, reference_type, balance_after, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, 'reward_redemption', $6, $7)`,
      [
        memberId,
        clubId,
        -pointsCost,
        `Reward redeemed: ${reward.reward_name}`,
        redemptionResult.rows[0].id,
        newBalance,
        memberId,
      ]
    );

    await client.query('COMMIT');

    const redemption = redemptionResult.rows[0];

    // Audit log (best-effort, outside the transaction).
    await auditService.logAction(
      AuditActionType.REWARD_REDEEMED,
      memberId,
      clubId,
      {
        rewardId,
        rewardName: reward.reward_name,
        pointsSpent: pointsCost,
        redemptionId: redemption.id,
        newBalance,
      },
      req
    );

    res.status(201).json({
      status: 'success',
      data: {
        redemption: {
          ...redemption,
          reward_name: reward.reward_name,
          reward_type: reward.reward_type,
          value: reward.value,
        },
        pointsBalance: newBalance,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * GET /clubs/:clubId/members/me/redeemed-rewards
 * List the authenticated member's redemption history (redeemed_rewards joined with
 * the reward it was redeemed for). Scoped to req.user.id — members only.
 */
export const getMyRedeemedRewards = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId;
  const memberId = req.user!.id;

  const result = await query(
    `SELECT
       rr.id, rr.reward_id, rr.member_id, rr.points_spent, rr.status,
       rr.redeemed_at, rr.used_at, rr.notes,
       r.reward_name, r.description, r.reward_type, r.value, r.image_url,
       r.valid_until
     FROM redeemed_rewards rr
     JOIN rewards r ON rr.reward_id = r.id
     WHERE rr.member_id = $1 AND r.club_id = $2
     ORDER BY rr.redeemed_at DESC`,
    [memberId, clubId]
  );

  res.status(200).json({
    status: 'success',
    data: { redeemedRewards: result.rows },
  });
});
