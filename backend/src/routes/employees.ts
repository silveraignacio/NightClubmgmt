import express from 'express';
import * as employeesController from '../controllers/employeesController';
import { protect, restrictTo } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';
import { validate } from '../middleware/validation';
import { inviteEmployeeSchema } from '../utils/validators';

const router = express.Router();

router.use(protect);

// Employee invite/manage is admin-only per .claude/rules/rbac.md
// (POST /clubs/:id/employees/invite -> ✅ admin, ❌ everyone else).
router.get(
  '/clubs/:clubId/employees',
  ensureClubAccess,
  restrictTo('admin'),
  employeesController.listEmployees
);

router.post(
  '/clubs/:clubId/employees/invite',
  ensureClubAccess,
  restrictTo('admin'),
  validate(inviteEmployeeSchema),
  employeesController.inviteEmployee
);

router.get(
  '/clubs/:clubId/employees/invitations',
  ensureClubAccess,
  restrictTo('admin'),
  employeesController.listInvitations
);

router.delete(
  '/clubs/:clubId/employees/invitations/:id',
  ensureClubAccess,
  restrictTo('admin'),
  employeesController.revokeInvitation
);

router.delete(
  '/clubs/:clubId/employees/:userId',
  ensureClubAccess,
  restrictTo('admin'),
  employeesController.deactivateEmployee
);

export default router;
