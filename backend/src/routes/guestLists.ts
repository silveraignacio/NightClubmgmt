import express from 'express';
import * as guestListController from '../controllers/guestListController';
import { protect, restrictTo } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';
import { validate } from '../middleware/validation';
import {
  createGuestListSchema,
  updateGuestListSchema,
  addGuestListEntrySchema,
} from '../utils/validators';

const router = express.Router();

router.use(protect);

// RBAC per docs/architecture/rbac-matrix.md "Guest Lists". Check-in also
// allows `doorman` — the doc as written only had admin/manager/security,
// but checking guests in at the door is doorman's core job (see
// docs/product/PRODUCT_FOUNDATION.md); doc updated with a note.
router.get('/clubs/:clubId/guest-lists', ensureClubAccess, guestListController.getGuestLists);

router.get('/clubs/:clubId/guest-lists/:listId', ensureClubAccess, guestListController.getGuestListById);

router.get(
  '/clubs/:clubId/guest-lists/:listId/entries',
  ensureClubAccess,
  guestListController.getEntries
);

router.post(
  '/clubs/:clubId/guest-lists',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  validate(createGuestListSchema),
  guestListController.createGuestList
);

router.put(
  '/clubs/:clubId/guest-lists/:listId',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  validate(updateGuestListSchema),
  guestListController.updateGuestList
);

router.delete(
  '/clubs/:clubId/guest-lists/:listId',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  guestListController.deleteGuestList
);

router.post(
  '/clubs/:clubId/guest-lists/:listId/entries',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  validate(addGuestListEntrySchema),
  guestListController.addEntry
);

router.delete(
  '/clubs/:clubId/guest-lists/:listId/entries/:entryId',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  guestListController.removeEntry
);

router.post(
  '/clubs/:clubId/guest-lists/:listId/entries/:entryId/check-in',
  ensureClubAccess,
  restrictTo('admin', 'manager', 'security', 'doorman'),
  guestListController.checkInEntry
);

export default router;
