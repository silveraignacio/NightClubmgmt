import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { catchAsync } from '../utils/errorHandler';

export const getAllMembershipTiers = catchAsync(async (req: AuthRequest, res: Response) => {
  const clubId = req.clubId;

  const result = await query(
    `SELECT id, tier_name, description, color_hex, points_multiplier,
            discount_percentage, entry_cost, points_required, sort_order
     FROM membership_tiers
     WHERE club_id = $1 AND is_active = true
     ORDER BY sort_order ASC, entry_cost ASC`,
    [clubId]
  );

  res.status(200).json({
    status: 'success',
    data: { tiers: result.rows },
  });
});
