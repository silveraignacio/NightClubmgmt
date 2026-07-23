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
