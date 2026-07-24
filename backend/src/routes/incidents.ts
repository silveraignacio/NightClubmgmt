import express from 'express';
import * as incidentsController from '../controllers/incidentsController';
import { protect, restrictTo } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';
import { validate } from '../middleware/validation';
import { createIncidentSchema, updateIncidentSchema, resolveIncidentSchema } from '../utils/validators';

const router = express.Router();

router.use(protect);

// RBAC per docs/architecture/rbac-matrix.md "Incidents": admin/manager/security
// can report and view; only admin/manager can resolve or see stats.
router.get(
  '/clubs/:clubId/incidents',
  ensureClubAccess,
  restrictTo('admin', 'manager', 'security'),
  incidentsController.getIncidents
);

router.get(
  '/clubs/:clubId/incidents/tonight',
  ensureClubAccess,
  restrictTo('admin', 'manager', 'security'),
  incidentsController.getTonightIncidents
);

router.get(
  '/clubs/:clubId/incidents/stats',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  incidentsController.getIncidentStats
);

router.get(
  '/clubs/:clubId/incidents/:incidentId',
  ensureClubAccess,
  restrictTo('admin', 'manager', 'security'),
  incidentsController.getIncidentById
);

router.post(
  '/clubs/:clubId/incidents',
  ensureClubAccess,
  restrictTo('admin', 'manager', 'security'),
  validate(createIncidentSchema),
  incidentsController.createIncident
);

router.put(
  '/clubs/:clubId/incidents/:incidentId',
  ensureClubAccess,
  restrictTo('admin', 'manager', 'security'),
  validate(updateIncidentSchema),
  incidentsController.updateIncident
);

router.post(
  '/clubs/:clubId/incidents/:incidentId/resolve',
  ensureClubAccess,
  restrictTo('admin', 'manager'),
  validate(resolveIncidentSchema),
  incidentsController.resolveIncident
);

export default router;
