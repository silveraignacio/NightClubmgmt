import express from 'express';
import * as membersController from '../controllers/membersController';
import { protect, restrictTo } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';
import { validate } from '../middleware/validation';
import { memberRegistrationSchema, memberUpdateSchema } from '../utils/validators';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Club-specific member routes
router
  .route('/clubs/:clubId/members')
  .get(ensureClubAccess, membersController.getAllMembers)
  .post(ensureClubAccess, restrictTo('admin', 'manager'), validate(memberRegistrationSchema), membersController.createMember);

router
  .route('/clubs/:clubId/members/:memberId')
  .get(ensureClubAccess, membersController.getMemberById)
  .patch(ensureClubAccess, validate(memberUpdateSchema), membersController.updateMember)
  .delete(ensureClubAccess, restrictTo('admin', 'manager'), membersController.deleteMember);

router.get('/clubs/:clubId/members/:memberId/qr-code', ensureClubAccess, membersController.getMemberQRCode);
router.get('/clubs/:clubId/members/:memberId/stats', ensureClubAccess, membersController.getMemberStats);

export default router;
