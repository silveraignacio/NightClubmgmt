import express from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validation';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validators';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/register/club', authLimiter, validate(registerSchema), authController.registerClubOwner);
router.post('/register/member', authLimiter, validate(registerSchema), authController.registerMember);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/verify', protect, authController.verifyToken);
router.post('/change-password', protect, authLimiter, validate(changePasswordSchema), authController.changePassword);

router.post('/verify-email', authLimiter, validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', protect, authLimiter, authController.resendVerificationEmail);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default router;
