import express from 'express';
import * as rewardsController from '../controllers/rewardsController';
import { protect, restrictTo } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Reward catalog — any authenticated club user or member may browse.
router.get(
  '/clubs/:clubId/rewards',
  ensureClubAccess,
  rewardsController.getClubRewards
);

// Redeem a reward for the currently authenticated member. Members only, since it
// redeems against req.user.id.
router.post(
  '/clubs/:clubId/rewards/:rewardId/redeem',
  ensureClubAccess,
  restrictTo('member'),
  rewardsController.redeemReward
);

// The authenticated member's own redemption history.
router.get(
  '/clubs/:clubId/members/me/redeemed-rewards',
  ensureClubAccess,
  restrictTo('member'),
  rewardsController.getMyRedeemedRewards
);

export default router;
