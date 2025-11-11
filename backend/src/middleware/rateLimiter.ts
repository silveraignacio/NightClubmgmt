import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/errorHandler';
import { auditService, AuditActionType } from '../services/auditService';
import { AuthRequest } from './auth';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    const authReq = req as AuthRequest;
    // Audit log for rate limit exceeded
    await auditService.logAction(
      AuditActionType.RATE_LIMIT_EXCEEDED,
      authReq.user?.id,
      authReq.clubId,
      {
        limitType: 'api',
        path: req.originalUrl || req.url,
        method: req.method,
      },
      req
    );
    throw new AppError('Too many requests from this IP, please try again later.', 429);
  },
});

// Stricter rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again after 15 minutes.',
  handler: async (req, res) => {
    // Audit log for suspicious authentication attempts
    await auditService.logAction(
      AuditActionType.SUSPICIOUS_ACTIVITY,
      undefined,
      undefined,
      {
        limitType: 'auth',
        path: req.originalUrl || req.url,
        method: req.method,
        reason: 'Too many authentication attempts',
      },
      req
    );
    throw new AppError('Too many authentication attempts, please try again after 15 minutes.', 429);
  },
});

// Rate limiter for QR scanning (higher limit)
export const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 scans per minute
  message: 'Too many scan requests, please slow down.',
  handler: (req, res) => {
    throw new AppError('Too many scan requests, please slow down.', 429);
  },
});

// Rate limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset attempts, please try again later.',
  handler: (req, res) => {
    throw new AppError('Too many password reset attempts, please try again later.', 429);
  },
});
