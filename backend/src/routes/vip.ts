import express from 'express';
import * as vipController from '../controllers/vipController';
import { protect, restrictTo } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';
import { validate } from '../middleware/validation';
import {
  createVipTableSchema,
  updateVipTableSchema,
  createVipReservationSchema,
  updateVipReservationStatusSchema,
} from '../utils/validators';

const router = express.Router();

router.use(protect);

// RBAC per docs/architecture/rbac-matrix.md "VIP" — tables managed by
// admin/manager only; viewing tables/reservations and creating a
// reservation is open to any staff role (front-of-house needs this to seat
// walk-ins). Status updates/cancellation aren't in that doc's original
// scope but are needed to operate a reservation day-to-day — scoped to
// admin/manager/doorman (doorman seats guests at the door).
router.get('/clubs/:clubId/vip/tables', ensureClubAccess, vipController.getTables);

router.post(
  '/clubs/:clubId/vip/tables',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  validate(createVipTableSchema),
  vipController.createTable
);

router.put(
  '/clubs/:clubId/vip/tables/:tableId',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  validate(updateVipTableSchema),
  vipController.updateTable
);

router.delete(
  '/clubs/:clubId/vip/tables/:tableId',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  vipController.deleteTable
);

router.get('/clubs/:clubId/vip/reservations', ensureClubAccess, vipController.getReservations);

router.post(
  '/clubs/:clubId/vip/reservations',
  ensureClubAccess,
  validate(createVipReservationSchema),
  vipController.createReservation
);

router.patch(
  '/clubs/:clubId/vip/reservations/:reservationId/status',
  ensureClubAccess,
  restrictTo('admin', 'manager', 'doorman'),
  validate(updateVipReservationStatusSchema),
  vipController.updateReservationStatus
);

router.delete(
  '/clubs/:clubId/vip/reservations/:reservationId',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  vipController.deleteReservation
);

export default router;
