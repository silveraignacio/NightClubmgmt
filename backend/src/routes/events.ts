import express from 'express';
import * as eventsController from '../controllers/eventsController';
import { protect, restrictTo } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';
import { validate } from '../middleware/validation';
import { createEventSchema, updateEventSchema } from '../utils/validators';

const router = express.Router();

router.use(protect);

// RBAC per docs/architecture/rbac-matrix.md "Events".
router.get('/clubs/:clubId/events', ensureClubAccess, eventsController.getEvents);

router.get('/clubs/:clubId/events/:eventId', ensureClubAccess, eventsController.getEventById);

router.post(
  '/clubs/:clubId/events',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  validate(createEventSchema),
  eventsController.createEvent
);

router.put(
  '/clubs/:clubId/events/:eventId',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  validate(updateEventSchema),
  eventsController.updateEvent
);

router.delete(
  '/clubs/:clubId/events/:eventId',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  eventsController.deleteEvent
);

router.post(
  '/clubs/:clubId/events/:eventId/attendance/:memberId',
  ensureClubAccess,
  restrictTo('admin', 'manager', 'bartender'),
  eventsController.markAttendance
);

export default router;
