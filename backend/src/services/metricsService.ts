import { query } from '../config/database';
import logger from '../utils/logger';

export interface RevenueMetrics {
  totalRevenue: number;
  transactionCount: number;
  averageTransaction: number;
  date?: string;
}

export interface MemberMetrics {
  totalMembers: number;
  activeMembers: number;
  newMembers: number;
  churnRate: number;
  retentionRate: number;
}

export interface EngagementMetrics {
  dailyVisits: number;
  avgVisitsPerMember: number;
  repeatVisitRate: number;
  avgTransactionValue: number;
}

export interface BusinessMetrics {
  revenue: RevenueMetrics;
  members: MemberMetrics;
  engagement: EngagementMetrics;
  timestamp: Date;
}

/**
 * Metrics Service
 * Provides business intelligence and analytics for club operations
 */
class MetricsService {
  /**
   * Get daily revenue for a specific date
   */
  async getDailyRevenue(clubId: string, date: Date): Promise<number> {
    try {
      const result = await query(
        `
        SELECT COALESCE(SUM(amount), 0) as revenue
        FROM transactions
        WHERE club_id = $1
          AND status = 'completed'
          AND DATE(transaction_date) = DATE($2)
        `,
        [clubId, date]
      );

      return parseFloat(result.rows[0]?.revenue || '0');
    } catch (error) {
      logger.error('Failed to get daily revenue', { error, clubId, date });
      throw error;
    }
  }

  /**
   * Get monthly revenue for a specific month
   */
  async getMonthlyRevenue(clubId: string, date: Date): Promise<RevenueMetrics> {
    try {
      const result = await query(
        `
        SELECT
          COALESCE(SUM(amount), 0) as total_revenue,
          COUNT(*) as transaction_count,
          COALESCE(AVG(amount), 0) as average_transaction
        FROM transactions
        WHERE club_id = $1
          AND status = 'completed'
          AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM $2::date)
          AND EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM $2::date)
        `,
        [clubId, date]
      );

      const row = result.rows[0];
      return {
        totalRevenue: parseFloat(row.total_revenue || '0'),
        transactionCount: parseInt(row.transaction_count || '0'),
        averageTransaction: parseFloat(row.average_transaction || '0'),
      };
    } catch (error) {
      logger.error('Failed to get monthly revenue', { error, clubId, date });
      throw error;
    }
  }

  /**
   * Get total members count
   */
  async getTotalMembers(clubId: string): Promise<number> {
    try {
      const result = await query(
        `
        SELECT COUNT(*) as count
        FROM club_members
        WHERE club_id = $1
        `,
        [clubId]
      );

      return parseInt(result.rows[0]?.count || '0');
    } catch (error) {
      logger.error('Failed to get total members', { error, clubId });
      throw error;
    }
  }

  /**
   * Get active members (members who visited in the last N days)
   */
  async getActiveMembers(clubId: string, days: number = 30): Promise<number> {
    try {
      const result = await query(
        `
        SELECT COUNT(DISTINCT member_id) as count
        FROM visits
        WHERE club_id = $1
          AND member_id IS NOT NULL
          AND entry_time >= NOW() - INTERVAL '${days} days'
        `,
        [clubId]
      );

      return parseInt(result.rows[0]?.count || '0');
    } catch (error) {
      logger.error('Failed to get active members', { error, clubId, days });
      throw error;
    }
  }

  /**
   * Calculate churn rate (members who haven't visited in 60+ days)
   */
  async calculateChurnRate(clubId: string): Promise<number> {
    try {
      const totalMembers = await this.getTotalMembers(clubId);

      if (totalMembers === 0) {
        return 0;
      }

      const result = await query(
        `
        SELECT COUNT(*) as churned_members
        FROM club_members
        WHERE club_id = $1
          AND (
            last_visit IS NULL
            OR last_visit < NOW() - INTERVAL '60 days'
          )
        `,
        [clubId]
      );

      const churnedMembers = parseInt(result.rows[0]?.churned_members || '0');
      const churnRate = (churnedMembers / totalMembers) * 100;

      return Math.round(churnRate * 100) / 100; // Round to 2 decimals
    } catch (error) {
      logger.error('Failed to calculate churn rate', { error, clubId });
      throw error;
    }
  }

  /**
   * Get daily visits for a specific date
   */
  async getDailyVisits(clubId: string, date: Date): Promise<number> {
    try {
      const result = await query(
        `
        SELECT COUNT(*) as count
        FROM visits
        WHERE club_id = $1
          AND DATE(entry_time) = DATE($2)
        `,
        [clubId, date]
      );

      return parseInt(result.rows[0]?.count || '0');
    } catch (error) {
      logger.error('Failed to get daily visits', { error, clubId, date });
      throw error;
    }
  }

  /**
   * Get average transaction value
   */
  async getAvgTransactionValue(clubId: string, days: number = 30): Promise<number> {
    try {
      const result = await query(
        `
        SELECT COALESCE(AVG(amount), 0) as avg_value
        FROM transactions
        WHERE club_id = $1
          AND status = 'completed'
          AND transaction_date >= NOW() - INTERVAL '${days} days'
        `,
        [clubId]
      );

      return parseFloat(result.rows[0]?.avg_value || '0');
    } catch (error) {
      logger.error('Failed to get avg transaction value', { error, clubId, days });
      throw error;
    }
  }

  /**
   * Calculate retention rate (members who returned within N days)
   */
  async getRetentionRate(clubId: string, days: number = 30): Promise<number> {
    try {
      // Get members who joined before the period
      const existingMembersResult = await query(
        `
        SELECT COUNT(*) as count
        FROM club_members
        WHERE club_id = $1
          AND registration_date < NOW() - INTERVAL '${days} days'
        `,
        [clubId]
      );

      const existingMembers = parseInt(existingMembersResult.rows[0]?.count || '0');

      if (existingMembers === 0) {
        return 0;
      }

      // Get how many of those returned
      const returnedMembersResult = await query(
        `
        SELECT COUNT(DISTINCT v.member_id) as count
        FROM visits v
        INNER JOIN club_members m ON v.member_id = m.id
        WHERE v.club_id = $1
          AND v.entry_time >= NOW() - INTERVAL '${days} days'
          AND m.registration_date < NOW() - INTERVAL '${days} days'
        `,
        [clubId]
      );

      const returnedMembers = parseInt(returnedMembersResult.rows[0]?.count || '0');
      const retentionRate = (returnedMembers / existingMembers) * 100;

      return Math.round(retentionRate * 100) / 100; // Round to 2 decimals
    } catch (error) {
      logger.error('Failed to get retention rate', { error, clubId, days });
      throw error;
    }
  }

  /**
   * Get new members in the last N days
   */
  async getNewMembers(clubId: string, days: number = 30): Promise<number> {
    try {
      const result = await query(
        `
        SELECT COUNT(*) as count
        FROM club_members
        WHERE club_id = $1
          AND registration_date >= NOW() - INTERVAL '${days} days'
        `,
        [clubId]
      );

      return parseInt(result.rows[0]?.count || '0');
    } catch (error) {
      logger.error('Failed to get new members', { error, clubId, days });
      throw error;
    }
  }

  /**
   * Get repeat visit rate (members with 2+ visits in period)
   */
  async getRepeatVisitRate(clubId: string, days: number = 30): Promise<number> {
    try {
      const totalVisitsResult = await query(
        `
        SELECT COUNT(DISTINCT member_id) as count
        FROM visits
        WHERE club_id = $1
          AND member_id IS NOT NULL
          AND entry_time >= NOW() - INTERVAL '${days} days'
        `,
        [clubId]
      );

      const totalUniqueMembers = parseInt(totalVisitsResult.rows[0]?.count || '0');

      if (totalUniqueMembers === 0) {
        return 0;
      }

      const repeatVisitsResult = await query(
        `
        SELECT COUNT(DISTINCT member_id) as count
        FROM (
          SELECT member_id, COUNT(*) as visit_count
          FROM visits
          WHERE club_id = $1
            AND member_id IS NOT NULL
            AND entry_time >= NOW() - INTERVAL '${days} days'
          GROUP BY member_id
          HAVING COUNT(*) >= 2
        ) as repeat_members
        `,
        [clubId]
      );

      const repeatMembers = parseInt(repeatVisitsResult.rows[0]?.count || '0');
      const repeatRate = (repeatMembers / totalUniqueMembers) * 100;

      return Math.round(repeatRate * 100) / 100; // Round to 2 decimals
    } catch (error) {
      logger.error('Failed to get repeat visit rate', { error, clubId, days });
      throw error;
    }
  }

  /**
   * Get average visits per member
   */
  async getAvgVisitsPerMember(clubId: string, days: number = 30): Promise<number> {
    try {
      const result = await query(
        `
        SELECT
          COALESCE(COUNT(*)::float / NULLIF(COUNT(DISTINCT member_id), 0), 0) as avg_visits
        FROM visits
        WHERE club_id = $1
          AND member_id IS NOT NULL
          AND entry_time >= NOW() - INTERVAL '${days} days'
        `,
        [clubId]
      );

      return parseFloat(result.rows[0]?.avg_visits || '0');
    } catch (error) {
      logger.error('Failed to get avg visits per member', { error, clubId, days });
      throw error;
    }
  }

  /**
   * Track and aggregate all business metrics
   */
  async trackBusinessMetrics(clubId: string, days: number = 30): Promise<BusinessMetrics> {
    try {
      const now = new Date();

      // Get revenue metrics
      const monthlyRevenue = await this.getMonthlyRevenue(clubId, now);
      const avgTransactionValue = await this.getAvgTransactionValue(clubId, days);

      // Get member metrics
      const totalMembers = await this.getTotalMembers(clubId);
      const activeMembers = await this.getActiveMembers(clubId, days);
      const newMembers = await this.getNewMembers(clubId, days);
      const churnRate = await this.calculateChurnRate(clubId);
      const retentionRate = await this.getRetentionRate(clubId, days);

      // Get engagement metrics
      const dailyVisits = await this.getDailyVisits(clubId, now);
      const avgVisitsPerMember = await this.getAvgVisitsPerMember(clubId, days);
      const repeatVisitRate = await this.getRepeatVisitRate(clubId, days);

      const metrics: BusinessMetrics = {
        revenue: {
          totalRevenue: monthlyRevenue.totalRevenue,
          transactionCount: monthlyRevenue.transactionCount,
          averageTransaction: avgTransactionValue,
        },
        members: {
          totalMembers,
          activeMembers,
          newMembers,
          churnRate,
          retentionRate,
        },
        engagement: {
          dailyVisits,
          avgVisitsPerMember,
          repeatVisitRate,
          avgTransactionValue,
        },
        timestamp: now,
      };

      logger.info('Business metrics tracked', {
        clubId,
        metrics,
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to track business metrics', { error, clubId });
      throw error;
    }
  }

  /**
   * Get revenue trends (daily breakdown for last N days)
   */
  async getRevenueTrends(clubId: string, days: number = 30): Promise<any[]> {
    try {
      const result = await query(
        `
        SELECT
          DATE(transaction_date) as date,
          COALESCE(SUM(amount), 0) as revenue,
          COUNT(*) as transaction_count
        FROM transactions
        WHERE club_id = $1
          AND status = 'completed'
          AND transaction_date >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(transaction_date)
        ORDER BY date DESC
        `,
        [clubId]
      );

      return result.rows.map((row) => ({
        date: row.date,
        revenue: parseFloat(row.revenue || '0'),
        transactionCount: parseInt(row.transaction_count || '0'),
      }));
    } catch (error) {
      logger.error('Failed to get revenue trends', { error, clubId, days });
      throw error;
    }
  }

  /**
   * Get visit trends (daily breakdown for last N days)
   */
  async getVisitTrends(clubId: string, days: number = 30): Promise<any[]> {
    try {
      const result = await query(
        `
        SELECT
          DATE(entry_time) as date,
          COUNT(*) as visits,
          COUNT(DISTINCT member_id) as unique_members
        FROM visits
        WHERE club_id = $1
          AND entry_time >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(entry_time)
        ORDER BY date DESC
        `,
        [clubId]
      );

      return result.rows.map((row) => ({
        date: row.date,
        visits: parseInt(row.visits || '0'),
        uniqueMembers: parseInt(row.unique_members || '0'),
      }));
    } catch (error) {
      logger.error('Failed to get visit trends', { error, clubId, days });
      throw error;
    }
  }

  /**
   * Get top members by spending
   */
  async getTopMembersBySpending(clubId: string, limit: number = 10): Promise<any[]> {
    try {
      const result = await query(
        `
        SELECT
          m.id,
          m.full_name,
          m.email,
          m.membership_type,
          COALESCE(SUM(t.amount), 0) as total_spent,
          COUNT(t.id) as transaction_count
        FROM club_members m
        LEFT JOIN transactions t ON m.id = t.member_id AND t.status = 'completed'
        WHERE m.club_id = $1
        GROUP BY m.id, m.full_name, m.email, m.membership_type
        ORDER BY total_spent DESC
        LIMIT $2
        `,
        [clubId, limit]
      );

      return result.rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        membershipType: row.membership_type,
        totalSpent: parseFloat(row.total_spent || '0'),
        transactionCount: parseInt(row.transaction_count || '0'),
      }));
    } catch (error) {
      logger.error('Failed to get top members by spending', { error, clubId });
      throw error;
    }
  }

  /**
   * Get top members by visits
   */
  async getTopMembersByVisits(clubId: string, limit: number = 10): Promise<any[]> {
    try {
      const result = await query(
        `
        SELECT
          m.id,
          m.full_name,
          m.email,
          m.membership_type,
          m.total_visits,
          m.last_visit
        FROM club_members m
        WHERE m.club_id = $1
        ORDER BY m.total_visits DESC
        LIMIT $2
        `,
        [clubId, limit]
      );

      return result.rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        membershipType: row.membership_type,
        totalVisits: row.total_visits,
        lastVisit: row.last_visit,
      }));
    } catch (error) {
      logger.error('Failed to get top members by visits', { error, clubId });
      throw error;
    }
  }
}

export const metricsService = new MetricsService();
