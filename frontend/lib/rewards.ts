import apiClient, { ApiResponse, PaginatedResponse, handleApiError } from './api';

/**
 * Reward Types
 */
export interface Reward {
  id: string;
  clubId: string;
  name: string;
  description: string;
  pointsRequired: number;
  category: 'drinks' | 'food' | 'vip' | 'experiences' | 'merchandise' | 'discounts';
  value: number;
  quantity?: number;
  expiresInDays?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RedeemedReward {
  id: string;
  memberId: string;
  rewardId: string;
  reward: Reward;
  redeemedAt: string;
  expiresAt: string;
  code?: string;
  used: boolean;
  usedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRewardData {
  name: string;
  description: string;
  pointsRequired: number;
  category: 'drinks' | 'food' | 'vip' | 'experiences' | 'merchandise' | 'discounts';
  value: number;
  quantity?: number;
  expiresInDays?: number;
}

export interface RedeemRewardData {
  rewardId: string;
  notes?: string;
}

export interface GetRewardsParams {
  page?: number;
  pageSize?: number;
  category?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'pointsRequired' | 'value' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface GetRedeemedRewardsParams {
  page?: number;
  pageSize?: number;
  memberId?: string;
  used?: boolean;
  sortBy?: 'redeemedAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get all available rewards for a club
 */
export const getRewards = async (
  clubId: string,
  params?: GetRewardsParams
): Promise<PaginatedResponse<Reward>> => {
  try {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Reward>>>(
      `/clubs/${clubId}/rewards`,
      { params }
    );

    return response.data.data || {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get a specific reward by ID
 */
export const getReward = async (
  clubId: string,
  rewardId: string
): Promise<Reward> => {
  try {
    const response = await apiClient.get<ApiResponse<Reward>>(
      `/clubs/${clubId}/rewards/${rewardId}`
    );

    return response.data.data || ({} as Reward);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create a new reward (admin only)
 */
export const createReward = async (
  clubId: string,
  data: CreateRewardData
): Promise<Reward> => {
  try {
    const response = await apiClient.post<ApiResponse<Reward>>(
      `/clubs/${clubId}/rewards`,
      data
    );

    return response.data.data || ({} as Reward);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update a reward (admin only)
 */
export const updateReward = async (
  clubId: string,
  rewardId: string,
  data: Partial<CreateRewardData>
): Promise<Reward> => {
  try {
    const response = await apiClient.put<ApiResponse<Reward>>(
      `/clubs/${clubId}/rewards/${rewardId}`,
      data
    );

    return response.data.data || ({} as Reward);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete a reward (admin only)
 */
export const deleteReward = async (
  clubId: string,
  rewardId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete<
      ApiResponse<{ success: boolean; message: string }>
    >(`/clubs/${clubId}/rewards/${rewardId}`);

    return response.data.data || { success: true, message: 'Reward deleted' };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get redeemed rewards for a member
 */
export const getMemberRedeemedRewards = async (
  clubId: string,
  memberId: string,
  params?: Omit<GetRedeemedRewardsParams, 'memberId'>
): Promise<PaginatedResponse<RedeemedReward>> => {
  try {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<RedeemedReward>>>(
      `/clubs/${clubId}/members/${memberId}/redeemed-rewards`,
      { params }
    );

    return response.data.data || {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all redeemed rewards for a club
 */
export const getRedeemedRewards = async (
  clubId: string,
  params?: GetRedeemedRewardsParams
): Promise<PaginatedResponse<RedeemedReward>> => {
  try {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<RedeemedReward>>>(
      `/clubs/${clubId}/redeemed-rewards`,
      { params }
    );

    return response.data.data || {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Redeem a reward for a member
 */
export const redeemReward = async (
  clubId: string,
  memberId: string,
  data: RedeemRewardData
): Promise<RedeemedReward> => {
  try {
    const response = await apiClient.post<ApiResponse<RedeemedReward>>(
      `/clubs/${clubId}/members/${memberId}/redeem-reward`,
      data
    );

    return response.data.data || ({} as RedeemedReward);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Mark a redeemed reward as used
 */
export const markRewardAsUsed = async (
  clubId: string,
  redeemedRewardId: string,
  notes?: string
): Promise<RedeemedReward> => {
  try {
    const response = await apiClient.patch<ApiResponse<RedeemedReward>>(
      `/clubs/${clubId}/redeemed-rewards/${redeemedRewardId}/mark-used`,
      { notes }
    );

    return response.data.data || ({} as RedeemedReward);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get reward categories
 */
export const getRewardCategories = async (
  clubId: string
): Promise<string[]> => {
  try {
    const response = await apiClient.get<ApiResponse<string[]>>(
      `/clubs/${clubId}/rewards/categories`
    );

    return response.data.data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get rewards by category
 */
export const getRewardsByCategory = async (
  clubId: string,
  category: string
): Promise<Reward[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Reward[]>>(
      `/clubs/${clubId}/rewards/category/${category}`
    );

    return response.data.data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Search rewards
 */
export const searchRewards = async (
  clubId: string,
  query: string
): Promise<Reward[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Reward[]>>(
      `/clubs/${clubId}/rewards/search`,
      { params: { q: query } }
    );

    return response.data.data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Export redeemed rewards to CSV
 */
export const exportRedeemedRewards = async (
  clubId: string,
  params?: GetRedeemedRewardsParams
): Promise<Blob> => {
  try {
    const response = await apiClient.get(
      `/clubs/${clubId}/redeemed-rewards/export`,
      {
        params,
        responseType: 'blob',
      }
    );

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};
