import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

// Extend Express Request to include id and context
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

/**
 * Request ID Middleware
 * Generates a unique UUID for each request and adds it to:
 * - req.id for internal tracking
 * - X-Request-ID response header
 * - All log entries
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate or use existing request ID
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  // Attach to request object
  req.id = requestId;
  req.startTime = Date.now();

  // Set response header
  res.setHeader('X-Request-ID', requestId);

  // Log incoming request with request ID
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  // Log response when finished
  const originalSend = res.send;
  res.send = function (data): Response {
    const duration = req.startTime ? Date.now() - req.startTime : 0;

    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Get request ID from request object
 */
export const getRequestId = (req: Request): string => {
  return req.id || 'unknown';
};
