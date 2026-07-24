import { Request } from 'express';
import { query } from '../config/database';
import logger from '../utils/logger';
import { getRequestId } from '../middleware/requestId';

/**
 * Audit Action Types
 */
export enum AuditActionType {
  // Member actions
  MEMBER_CREATED = 'member.created',
  MEMBER_UPDATED = 'member.updated',
  MEMBER_DELETED = 'member.deleted',
  MEMBER_LOGIN = 'member.login',
  MEMBER_LOGOUT = 'member.logout',
  MEMBER_DATA_EXPORTED = 'member.data_exported',

  // Visit actions
  VISIT_LOGGED = 'visit.logged',
  VISIT_UPDATED = 'visit.updated',

  // Transaction actions
  TRANSACTION_PROCESSED = 'transaction.processed',
  TRANSACTION_REFUNDED = 'transaction.refunded',
  TRANSACTION_CANCELLED = 'transaction.cancelled',

  // User actions
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',

  // Club actions
  CLUB_CREATED = 'club.created',
  CLUB_UPDATED = 'club.updated',
  CLUB_SETTINGS_CHANGED = 'club.settings.changed',

  // Points actions
  POINTS_AWARDED = 'points.awarded',
  POINTS_REDEEMED = 'points.redeemed',
  POINTS_ADJUSTED = 'points.adjusted',

  // Reward actions
  REWARD_CREATED = 'reward.created',
  REWARD_REDEEMED = 'reward.redeemed',

  // Promotion actions
  PROMOTION_CREATED = 'promotion.created',
  PROMOTION_UPDATED = 'promotion.updated',
  PROMOTION_DELETED = 'promotion.deleted',
  PROMOTION_APPLIED = 'promotion.applied',

  // Security actions
  UNAUTHORIZED_ACCESS = 'security.unauthorized_access',
  INVALID_TOKEN = 'security.invalid_token',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',

  // Email verification / password reset
  EMAIL_VERIFICATION_SENT = 'auth.email_verification_sent',
  EMAIL_VERIFIED = 'auth.email_verified',
  PASSWORD_RESET_REQUESTED = 'auth.password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'auth.password_reset_completed',

  // Incident actions
  INCIDENT_REPORTED = 'incident.reported',
  INCIDENT_RESOLVED = 'incident.resolved',
}

export interface AuditLogEntry {
  id?: string;
  action: AuditActionType | string;
  userId?: string;
  clubId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  timestamp?: Date;
}

export interface AuditLogFilters {
  startDate?: Date;
  endDate?: Date;
  action?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Audit Service
 * Provides comprehensive audit logging for all critical operations
 */
class AuditService {
  /**
   * Log an audit action
   */
  async logAction(
    action: AuditActionType | string,
    userId: string | undefined,
    clubId: string | undefined,
    metadata: Record<string, any> = {},
    req?: Request
  ): Promise<void> {
    try {
      const ipAddress = req ? (req.ip || req.socket.remoteAddress) : null;
      const userAgent = req ? req.headers['user-agent'] : null;
      const requestId = req ? getRequestId(req) : null;

      await query(
        `INSERT INTO audit_logs (
          action, user_id, club_id, metadata, ip_address, user_agent, request_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          action,
          userId || null,
          clubId || null,
          JSON.stringify(metadata),
          ipAddress,
          userAgent,
          requestId,
        ]
      );

      logger.info('Audit log created', {
        action,
        userId,
        clubId,
        requestId,
        metadata,
      });
    } catch (error) {
      logger.error('Failed to create audit log', {
        error,
        action,
        userId,
        clubId,
      });
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(
    clubId: string,
    filters: AuditLogFilters = {}
  ): Promise<AuditLogEntry[]> {
    try {
      const {
        startDate,
        endDate,
        action,
        userId,
        limit = 100,
        offset = 0,
      } = filters;

      let queryText = `
        SELECT
          id,
          action,
          user_id,
          club_id,
          metadata,
          ip_address,
          user_agent,
          request_id,
          created_at as timestamp
        FROM audit_logs
        WHERE club_id = $1
      `;

      const params: any[] = [clubId];
      let paramIndex = 2;

      if (startDate) {
        queryText += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        queryText += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (action) {
        queryText += ` AND action = $${paramIndex}`;
        params.push(action);
        paramIndex++;
      }

      if (userId) {
        queryText += ` AND user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await query(queryText, params);

      return result.rows.map((row) => ({
        id: row.id,
        action: row.action,
        userId: row.user_id,
        clubId: row.club_id,
        metadata: row.metadata,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        requestId: row.request_id,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      logger.error('Failed to get audit logs', { error, clubId, filters });
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats(clubId: string, days: number = 30): Promise<any> {
    try {
      const result = await query(
        `
        SELECT
          action,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM audit_logs
        WHERE club_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY action, DATE(created_at)
        ORDER BY date DESC, count DESC
        `,
        [clubId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get audit stats', { error, clubId, days });
      throw error;
    }
  }

  /**
   * Get recent security events
   */
  async getSecurityEvents(
    clubId: string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
    try {
      const result = await query(
        `
        SELECT
          id,
          action,
          user_id,
          club_id,
          metadata,
          ip_address,
          user_agent,
          request_id,
          created_at as timestamp
        FROM audit_logs
        WHERE club_id = $1
          AND action LIKE 'security.%'
        ORDER BY created_at DESC
        LIMIT $2
        `,
        [clubId, limit]
      );

      return result.rows.map((row) => ({
        id: row.id,
        action: row.action,
        userId: row.user_id,
        clubId: row.club_id,
        metadata: row.metadata,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        requestId: row.request_id,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      logger.error('Failed to get security events', { error, clubId });
      throw error;
    }
  }

  /**
   * Clean up old audit logs (for data retention policies)
   */
  async cleanupOldLogs(daysToKeep: number = 365): Promise<number> {
    try {
      const result = await query(
        `
        DELETE FROM audit_logs
        WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
        `
      );

      logger.info('Cleaned up old audit logs', {
        deletedCount: result.rowCount,
        daysToKeep,
      });

      return result.rowCount || 0;
    } catch (error) {
      logger.error('Failed to cleanup old logs', { error, daysToKeep });
      throw error;
    }
  }
}

export const auditService = new AuditService();
