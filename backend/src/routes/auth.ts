import express from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validation';
import { registerSchema, loginSchema } from '../utils/validators';
import { authLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.post('/register/club', authLimiter, validate(registerSchema), authController.registerClubOwner);
router.post('/register/member', authLimiter, validate(registerSchema), authController.registerMember);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

export default router;
