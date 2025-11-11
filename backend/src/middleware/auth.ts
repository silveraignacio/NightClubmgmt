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
  res: Response,
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
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
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

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next();
      }

      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        email: string;
        role: string;
        clubId?: string;
      };

      req.user = decoded;
      req.clubId = decoded.clubId;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};
