import { query } from '../config/database';
import { AppError } from '../utils/errorHandler';

export interface PointsUpdate {
  memberId: string;
  clubId: string;
  pointsChange: number;
  reason: string;
  referenceId?: string;
  referenceType?: string;
  createdByUserId?: string;
}

export const updateMemberPoints = async (data: PointsUpdate) => {
  const { memberId, clubId, pointsChange, reason, referenceId, referenceType, createdByUserId } = data;

  // Get current points balance
  const memberResult = await query(
    'SELECT points_balance FROM club_members WHERE id = $1 AND club_id = $2',
    [memberId, clubId]
  );

  if (memberResult.rows.length === 0) {
    throw new AppError('Member not found', 404);
  }

  const currentBalance = memberResult.rows[0].points_balance;
  const newBalance = currentBalance + pointsChange;

  // Prevent negative balance
  if (newBalance < 0) {
    throw new AppError('Insufficient points balance', 400);
  }

  // Update member points
  await query(
    'UPDATE club_members SET points_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND club_id = $3',
    [newBalance, memberId, clubId]
  );

  // Log points history
  await query(
    `INSERT INTO points_history (member_id, club_id, points_change, reason, reference_id, reference_type, balance_after, created_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [memberId, clubId, pointsChange, reason, referenceId, referenceType, newBalance, createdByUserId]
  );

  // Check for badge achievements
  await checkBadgeAchievements(memberId, clubId, { pointsEarned: pointsChange });

  return {
    previousBalance: currentBalance,
    pointsChange,
    newBalance,
  };
};

export const getPointsHistory = async (memberId: string, clubId: string, limit: number = 50) => {
  const result = await query(
    `SELECT
      ph.*,
      cu.full_name as created_by_name
    FROM points_history ph
    LEFT JOIN club_users cu ON ph.created_by_user_id = cu.id
    WHERE ph.member_id = $1 AND ph.club_id = $2
    ORDER BY ph.created_at DESC
    LIMIT $3`,
    [memberId, clubId, limit]
  );

  return result.rows;
};

export const calculatePointsEarned = (amount: number, multiplier: number = 1): number => {
  // Base: 1 point per $1 spent
  const basePoints = Math.floor(amount);
  return Math.floor(basePoints * multiplier);
};

export const checkBadgeAchievements = async (
  memberId: string,
  clubId: string,
  _context: { pointsEarned?: number; visitCount?: number }
) => {
  // Get member's current stats
  const memberResult = await query(
    'SELECT points_balance, total_visits, total_spent FROM club_members WHERE id = $1',
    [memberId]
  );

  if (memberResult.rows.length === 0) return;

  const member = memberResult.rows[0];

  // Get all active badges for this club that member doesn't have yet
  const badgesResult = await query(
    `SELECT b.* FROM badges b
     WHERE b.club_id = $1
     AND b.is_active = true
     AND NOT EXISTS (
       SELECT 1 FROM member_badges mb
       WHERE mb.member_id = $2 AND mb.badge_id = b.id
     )`,
    [clubId, memberId]
  );

  for (const badge of badgesResult.rows) {
    const condition = badge.trigger_condition;
    let shouldAward = false;

    // Check trigger conditions
    if (condition.event === 'visit_count' && member.total_visits >= condition.value) {
      shouldAward = true;
    } else if (condition.event === 'points_earned' && member.points_balance >= condition.value) {
      shouldAward = true;
    } else if (condition.event === 'total_spent' && member.total_spent >= condition.value) {
      shouldAward = true;
    }

    if (shouldAward) {
      // Award badge
      await query(
        'INSERT INTO member_badges (member_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [memberId, badge.id]
      );

      // Award bonus points if applicable
      if (badge.points_reward > 0) {
        await updateMemberPoints({
          memberId,
          clubId,
          pointsChange: badge.points_reward,
          reason: `Badge earned: ${badge.badge_name}`,
          referenceId: badge.id,
          referenceType: 'badge',
        });
      }
    }
  }
};
