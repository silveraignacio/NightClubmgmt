import apiClient, { ApiResponse, handleApiError } from './api';

export interface MemberMetricsSummary {
  totalMembers: number;
  activeMembers: number;
  newMembers: number;
  churnRate: number;
  retentionRate: number;
  activeMembersPercentage: number;
}

/**
 * Get member metrics (total/active/new members, churn, retention) for a club.
 * Backed by GET /clubs/:clubId/metrics/members (admin/manager only).
 */
export const getMemberMetrics = async (
  clubId: string,
  days = 30
): Promise<MemberMetricsSummary> => {
  try {
    const response = await apiClient.get<ApiResponse<{ summary: MemberMetricsSummary }>>(
      `/clubs/${clubId}/metrics/members`,
      { params: { days } }
    );

    return (
      response.data.data?.summary || {
        totalMembers: 0,
        activeMembers: 0,
        newMembers: 0,
        churnRate: 0,
        retentionRate: 0,
        activeMembersPercentage: 0,
      }
    );
  } catch (error) {
    throw handleApiError(error);
  }
};

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  transactionCount: number;
}

export interface RevenueMetrics {
  monthlyRevenue: number;
  transactionCount: number;
  averageTransaction: number;
  trends: RevenueTrendPoint[];
}

/**
 * Get revenue metrics + daily trend for a club.
 * Backed by GET /clubs/:clubId/metrics/revenue (admin/manager only).
 */
export const getRevenueMetrics = async (clubId: string, days = 30): Promise<RevenueMetrics> => {
  try {
    const response = await apiClient.get<
      ApiResponse<{
        summary: { monthlyRevenue: number; transactionCount: number; averageTransaction: number };
        trends: RevenueTrendPoint[];
      }>
    >(`/clubs/${clubId}/metrics/revenue`, { params: { days } });

    const data = response.data.data;
    return {
      monthlyRevenue: data?.summary.monthlyRevenue || 0,
      transactionCount: data?.summary.transactionCount || 0,
      averageTransaction: data?.summary.averageTransaction || 0,
      trends: data?.trends || [],
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export interface VisitTrendPoint {
  date: string;
  visits: number;
  uniqueMembers: number;
}

export interface EngagementMetrics {
  dailyVisits: number;
  avgVisitsPerMember: number;
  repeatVisitRate: number;
  trends: VisitTrendPoint[];
}

/**
 * Get visit/engagement metrics + daily trend for a club.
 * Backed by GET /clubs/:clubId/metrics/engagement (admin/manager only).
 */
export const getEngagementMetrics = async (clubId: string, days = 30): Promise<EngagementMetrics> => {
  try {
    const response = await apiClient.get<
      ApiResponse<{
        summary: { dailyVisits: number; avgVisitsPerMember: number; repeatVisitRate: number };
        trends: VisitTrendPoint[];
      }>
    >(`/clubs/${clubId}/metrics/engagement`, { params: { days } });

    const data = response.data.data;
    return {
      dailyVisits: data?.summary.dailyVisits || 0,
      avgVisitsPerMember: data?.summary.avgVisitsPerMember || 0,
      repeatVisitRate: data?.summary.repeatVisitRate || 0,
      trends: data?.trends || [],
    };
  } catch (error) {
    throw handleApiError(error);
  }
};
