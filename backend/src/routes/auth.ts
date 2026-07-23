import express from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validation';
import { registerSchema, loginSchema, changePasswordSchema } from '../utils/validators';
import { authLimiter } from '../middleware/rateLimiter';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/register/club', authLimiter, validate(registerSchema), authController.registerClubOwner);
router.post('/register/member', authLimiter, validate(registerSchema), authController.registerMember);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/verify', protect, authController.verifyToken);
router.post('/change-password', protect, authLimiter, validate(changePasswordSchema), authController.changePassword);

export default router;
