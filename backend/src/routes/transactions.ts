import express from 'express';
import * as transactionsController from '../controllers/transactionsController';
import { protect, restrictTo } from '../middleware/auth';
import { ensureClubAccess } from '../middleware/tenant';
import { validate } from '../middleware/validation';
import { createTransactionSchema } from '../utils/validators';
import { scanLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// All routes require authentication
router.use(protect);

router
  .route('/clubs/:clubId/transactions')
  .get(ensureClubAccess, transactionsController.getAllTransactions)
  .post(ensureClubAccess, restrictTo('admin', 'manager', 'bartender'), scanLimiter, validate(createTransactionSchema), transactionsController.createTransaction);

router.get('/clubs/:clubId/transactions/today/revenue', ensureClubAccess, transactionsController.getTodayRevenue);
router.get('/clubs/:clubId/transactions/:transactionId', ensureClubAccess, transactionsController.getTransactionById);

export default router;
