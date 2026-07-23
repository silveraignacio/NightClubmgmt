import express from 'express';
import * as membershipTiersController from '../controllers/membershipTiersController';
import { protect } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';

const router = express.Router();

router.use(protect);

router.get('/clubs/:clubId/membership-tiers', ensureClubAccess, membershipTiersController.getAllMembershipTiers);

export default router;
