import express from 'express';
import * as visitsController from '../controllers/visitsController';
import { protect, restrictTo } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';
import { validate } from '../middleware/validation';
import { createVisitSchema } from '../utils/validators';
import { scanLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// All routes require authentication
router.use(protect);

router
  .route('/clubs/:clubId/visits')
  .get(ensureClubAccess, restrictTo('admin', 'manager', 'doorman'), visitsController.getAllVisits)
  .post(ensureClubAccess, restrictTo('admin', 'manager', 'doorman'), scanLimiter, validate(createVisitSchema), visitsController.createVisit);

router.get('/clubs/:clubId/visits/today/count', ensureClubAccess, visitsController.getTodayVisitsCount);
router.get('/clubs/:clubId/members/:memberId/visits', ensureClubAccess, visitsController.getVisitsByMember);

export default router;
