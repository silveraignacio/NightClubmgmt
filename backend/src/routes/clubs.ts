import express from 'express';
import * as clubsController from '../controllers/clubsController';
import { protect, restrictTo } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';
import { validate } from '../middleware/validation';
import { updateClubSchema } from '../utils/validators';

const router = express.Router();

// All routes require authentication
router.use(protect);

router
  .route('/clubs/:clubId')
  .get(ensureClubAccess, restrictTo('admin', 'manager'), clubsController.getClub)
  .patch(
    ensureClubAccess,
    restrictTo('admin'),
    validate(updateClubSchema),
    clubsController.updateClub
  );

export default router;
