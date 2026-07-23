import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errorHandler';
import { query } from '../config/database';
import { auditService, AuditActionType } from '../services/auditService';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    clubId?: string;
  };
  clubId?: string;
}

export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    // 1) Get token from header
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // Audit log for unauthorized access attempt
      await auditService.logAction(
        AuditActionType.UNAUTHORIZED_ACCESS,
        undefined,
        undefined,
        { reason: 'Missing authentication token', path: req.originalUrl || req.url },
        req
      );
      throw new AppError('You are not logged in. Please log in to get access.', 401);
    }

    // 2) Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret is not configured', 500);
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      email: string;
      role: string;
      clubId?: string;
    };

    // 3) Check if user still exists
    let userQuery;
    if (decoded.role === 'member') {
      userQuery = await query(
        'SELECT id, email, club_id FROM club_members WHERE id = $1',
        [decoded.id]
      );
    } else {
      userQuery = await query(
        'SELECT id, email, role, club_id FROM club_users WHERE id = $1 AND is_active = true',
        [decoded.id]
      );
    }

    if (userQuery.rows.length === 0) {
      // Audit log for invalid token
      await auditService.logAction(
        AuditActionType.INVALID_TOKEN,
        decoded.id,
        undefined,
        { reason: 'User no longer exists', path: req.originalUrl || req.url },
        req
      );
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }

    // 4) Grant access to protected route
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      clubId: userQuery.rows[0].club_id,
    };
    req.clubId = userQuery.rows[0].club_id;

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      // Audit log for invalid JWT
      await auditService.logAction(
        AuditActionType.INVALID_TOKEN,
        undefined,
        undefined,
        { reason: 'Invalid JWT', error: error.message, path: req.originalUrl || req.url },
        req
      );
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      // Audit log for expired token
      await auditService.logAction(
        AuditActionType.INVALID_TOKEN,
        undefined,
        undefined,
        { reason: 'Expired JWT', path: req.originalUrl || req.url },
        req
      );
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    next(error);
  }
};

export const restrictTo = (...roles: string[]) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      // Audit log for unauthorized access attempt
      await auditService.logAction(
        AuditActionType.UNAUTHORIZED_ACCESS,
        req.user?.id,
        req.clubId,
        {
          reason: 'Insufficient permissions',
          requiredRoles: roles,
          userRole: req.user?.role,
          path: req.originalUrl || req.url,
        },
        req
      );
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

/**
 * Like restrictTo, but also allows a `member` acting on their own record
 * (req.params.memberId === req.user.id) — e.g. viewing/editing your own
 * profile, or fetching your own QR code/stats. Use for routes with a
 * `:memberId` param that should be self-service for members but
 * staff-accessible more broadly.
 */
export const restrictToSelfOrRoles = (...roles: string[]) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const isSelf = !!req.user && req.user.id === req.params.memberId;

    if (req.user && (isSelf || roles.includes(req.user.role))) {
      return next();
    }

    await auditService.logAction(
      AuditActionType.UNAUTHORIZED_ACCESS,
      req.user?.id,
      req.clubId,
      {
        reason: 'Insufficient permissions (not self, not an allowed role)',
        requiredRoles: roles,
        userRole: req.user?.role,
        path: req.originalUrl || req.url,
      },
      req
    );
    return next(
      new AppError('You do not have permission to perform this action', 403)
    );
  };
};

