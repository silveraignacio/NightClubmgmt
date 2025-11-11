import { Router, Response } from 'express';
import { protect, restrictTo, AuthRequest } from '../middleware/auth';
import { metricsService } from '../services/metricsService';
import { AppError } from '../utils/errorHandler';

const router = Router();

/**
 * GET /api/clubs/:clubId/metrics/overview
 * Get comprehensive business metrics overview
 */
router.get(
  '/clubs/:clubId/metrics/overview',
  protect,
  restrictTo('admin', 'manager'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { clubId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      // Verify user has access to this club
      if (req.user?.clubId !== clubId && req.user?.role !== 'admin') {
        throw new AppError('You do not have access to this club', 403);
      }

      const metrics = await metricsService.trackBusinessMetrics(clubId, days);

      res.status(200).json({
        status: 'success',
        data: {
          metrics,
          period: `${days} days`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/clubs/:clubId/metrics/revenue
 * Get detailed revenue metrics and trends
 */
router.get(
  '/clubs/:clubId/metrics/revenue',
  protect,
  restrictTo('admin', 'manager'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { clubId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      // Verify user has access to this club
      if (req.user?.clubId !== clubId && req.user?.role !== 'admin') {
        throw new AppError('You do not have access to this club', 403);
      }

      const [monthlyRevenue, avgTransactionValue, trends] = await Promise.all([
        metricsService.getMonthlyRevenue(clubId, new Date()),
        metricsService.getAvgTransactionValue(clubId, days),
        metricsService.getRevenueTrends(clubId, days),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          summary: {
            monthlyRevenue: monthlyRevenue.totalRevenue,
            transactionCount: monthlyRevenue.transactionCount,
            averageTransaction: avgTransactionValue,
          },
          trends,
          period: `${days} days`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/clubs/:clubId/metrics/members
 * Get detailed member metrics
 */
router.get(
  '/clubs/:clubId/metrics/members',
  protect,
  restrictTo('admin', 'manager'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { clubId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      // Verify user has access to this club
      if (req.user?.clubId !== clubId && req.user?.role !== 'admin') {
        throw new AppError('You do not have access to this club', 403);
      }

      const [
        totalMembers,
        activeMembers,
        newMembers,
        churnRate,
        retentionRate,
        topBySpending,
        topByVisits,
      ] = await Promise.all([
        metricsService.getTotalMembers(clubId),
        metricsService.getActiveMembers(clubId, days),
        metricsService.getNewMembers(clubId, days),
        metricsService.calculateChurnRate(clubId),
        metricsService.getRetentionRate(clubId, days),
        metricsService.getTopMembersBySpending(clubId, 10),
        metricsService.getTopMembersByVisits(clubId, 10),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          summary: {
            totalMembers,
            activeMembers,
            newMembers,
            churnRate,
            retentionRate,
            activeMembersPercentage:
              totalMembers > 0
                ? Math.round((activeMembers / totalMembers) * 100 * 100) / 100
                : 0,
          },
          topMembersBySpending: topBySpending,
          topMembersByVisits: topByVisits,
          period: `${days} days`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/clubs/:clubId/metrics/engagement
 * Get detailed engagement metrics
 */
router.get(
  '/clubs/:clubId/metrics/engagement',
  protect,
  restrictTo('admin', 'manager'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { clubId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      // Verify user has access to this club
      if (req.user?.clubId !== clubId && req.user?.role !== 'admin') {
        throw new AppError('You do not have access to this club', 403);
      }

      const [
        dailyVisits,
        avgVisitsPerMember,
        repeatVisitRate,
        visitTrends,
      ] = await Promise.all([
        metricsService.getDailyVisits(clubId, new Date()),
        metricsService.getAvgVisitsPerMember(clubId, days),
        metricsService.getRepeatVisitRate(clubId, days),
        metricsService.getVisitTrends(clubId, days),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          summary: {
            dailyVisits,
            avgVisitsPerMember,
            repeatVisitRate,
          },
          trends: visitTrends,
          period: `${days} days`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/clubs/:clubId/metrics/daily/:date
 * Get metrics for a specific date
 */
router.get(
  '/clubs/:clubId/metrics/daily/:date',
  protect,
  restrictTo('admin', 'manager'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { clubId, date } = req.params;

      // Verify user has access to this club
      if (req.user?.clubId !== clubId && req.user?.role !== 'admin') {
        throw new AppError('You do not have access to this club', 403);
      }

      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new AppError('Invalid date format', 400);
      }

      const [dailyRevenue, dailyVisits] = await Promise.all([
        metricsService.getDailyRevenue(clubId, targetDate),
        metricsService.getDailyVisits(clubId, targetDate),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          date: targetDate.toISOString().split('T')[0],
          revenue: dailyRevenue,
          visits: dailyVisits,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/clubs/:clubId/metrics/export
 * Export metrics data (CSV format)
 */
router.get(
  '/clubs/:clubId/metrics/export',
  protect,
  restrictTo('admin', 'manager'),
  async (req: AuthRequest, res: Response, next) => {
    try {
      const { clubId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      // Verify user has access to this club
      if (req.user?.clubId !== clubId && req.user?.role !== 'admin') {
        throw new AppError('You do not have access to this club', 403);
      }

      const metrics = await metricsService.trackBusinessMetrics(clubId, days);

      // Create CSV content
      const csvRows = [
        'Metric,Value',
        `Total Revenue,${metrics.revenue.totalRevenue}`,
        `Transaction Count,${metrics.revenue.transactionCount}`,
        `Average Transaction,${metrics.revenue.averageTransaction}`,
        `Total Members,${metrics.members.totalMembers}`,
        `Active Members,${metrics.members.activeMembers}`,
        `New Members,${metrics.members.newMembers}`,
        `Churn Rate,${metrics.members.churnRate}%`,
        `Retention Rate,${metrics.members.retentionRate}%`,
        `Daily Visits,${metrics.engagement.dailyVisits}`,
        `Avg Visits Per Member,${metrics.engagement.avgVisitsPerMember}`,
        `Repeat Visit Rate,${metrics.engagement.repeatVisitRate}%`,
      ];

      const csvContent = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="metrics-${clubId}-${new Date().toISOString().split('T')[0]}.csv"`
      );

      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
