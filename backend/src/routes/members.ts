import express from 'express';
import * as membersController from '../controllers/membersController';
import { protect, restrictTo, restrictToSelfOrRoles } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';
import { validate } from '../middleware/validation';
import { memberRegistrationSchema, memberUpdateSchema } from '../utils/validators';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Staff roles that can act on any member of their club (door/bar need to look
// up and check in members they don't "own"; admin/manager run the back office).
const STAFF_ROLES = ['admin', 'manager', 'doorman', 'bartender'] as const;

// Club-specific member routes
router
  .route('/clubs/:clubId/members')
  .get(ensureClubAccess, restrictTo(...STAFF_ROLES), membersController.getAllMembers)
  .post(ensureClubAccess, restrictTo('admin', 'manager'), validate(memberRegistrationSchema), membersController.createMember);

// Must be registered before '/:memberId' — otherwise Express would treat
// "export" as a :memberId value and this route would never be reached.
router.get('/clubs/:clubId/members/export', ensureClubAccess, restrictTo('admin', 'manager'), membersController.exportMembers);

router
  .route('/clubs/:clubId/members/:memberId')
  .get(ensureClubAccess, restrictToSelfOrRoles(...STAFF_ROLES), membersController.getMemberById)
  .patch(ensureClubAccess, restrictToSelfOrRoles('admin', 'manager'), validate(memberUpdateSchema), membersController.updateMember)
  .delete(ensureClubAccess, restrictTo('admin', 'manager'), membersController.deleteMember);

// Staff-only: door/bar resolve a scanned QR to a member record they don't own.
router.get('/clubs/:clubId/members/by-qr/:qrCodeId', ensureClubAccess, restrictTo(...STAFF_ROLES), membersController.getMemberByQrCode);

router.get('/clubs/:clubId/members/:memberId/qr-code', ensureClubAccess, restrictToSelfOrRoles(...STAFF_ROLES), membersController.getMemberQRCode);
router.get('/clubs/:clubId/members/:memberId/stats', ensureClubAccess, restrictToSelfOrRoles(...STAFF_ROLES), membersController.getMemberStats);

export default router;
