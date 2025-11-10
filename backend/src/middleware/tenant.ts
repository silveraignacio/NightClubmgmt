import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AppError } from '../utils/errorHandler';
import { query } from '../config/database';

/**
 * Multi-tenant middleware
 * Ensures that users can only access data from their own club
 */
export const ensureClubAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const clubIdFromParams = req.params.clubId;
    const userClubId = req.clubId;

    if (!userClubId) {
      throw new AppError('User is not associated with any club', 403);
    }

    // If clubId is in params, verify it matches user's club
    if (clubIdFromParams && clubIdFromParams !== userClubId) {
      throw new AppError('You do not have access to this club', 403);
    }

    // Verify club exists and is active
    const clubResult = await query(
      'SELECT id, status FROM clubs WHERE id = $1',
      [userClubId]
    );

    if (clubResult.rows.length === 0) {
      throw new AppError('Club not found', 404);
    }

    const club = clubResult.rows[0];

    if (club.status === 'suspended' || club.status === 'cancelled') {
      throw new AppError(
        'Your club subscription is not active. Please contact support or renew your subscription.',
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Attach club ID to request
 * For routes that need club context
 */
export const attachClubId = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const clubIdFromParams = req.params.clubId;

  if (clubIdFromParams) {
    req.clubId = clubIdFromParams;
  }

  next();
};

/**
 * Verify club owns a resource
 * Used for nested resources like members, events, etc.
 */
export const verifyResourceOwnership = (tableName: string, idParam: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params[idParam];
      const userClubId = req.clubId;

      if (!resourceId) {
        throw new AppError(`${idParam} is required`, 400);
      }

      const result = await query(
        `SELECT club_id FROM ${tableName} WHERE id = $1`,
        [resourceId]
      );

      if (result.rows.length === 0) {
        throw new AppError('Resource not found', 404);
      }

      if (result.rows[0].club_id !== userClubId) {
        throw new AppError('You do not have access to this resource', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
