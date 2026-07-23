import apiClient, { ApiResponse, handleApiError } from './api';

/**
 * Reward Types
 *
 * These map 1:1 to the backend rewards feature:
 *   GET  /clubs/:clubId/rewards                       -> catalog
 *   POST /clubs/:clubId/rewards/:rewardId/redeem      -> redeem for the caller
 *   GET  /clubs/:clubId/members/me/redeemed-rewards   -> caller's history
 * (see backend/src/controllers/rewardsController.ts + database/schema.sql).
 */
export type RewardType = 'discount' | 'free_item' | 'free_entry' | 'merchandise';
export type RedemptionStatus = 'active' | 'used' | 'expired';

export interface Reward {
  id: string;
  clubId: string;
  name: string;
  description: string;
  pointsRequired: number;
  rewardType: RewardType;
  value: number;
  imageUrl?: string;
  quantityAvailable?: number;
  quantityRedeemed: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RedeemedReward {
  id: string;
  rewardId: string;
  memberId: string;
  rewardName: string;
  description?: string;
  rewardType: RewardType;
  value: number;
  imageUrl?: string;
  pointsSpent: number;
  status: RedemptionStatus;
  redeemedAt: string;
  usedAt?: string;
  validUntil?: string;
  notes?: string;
}

export interface RedeemResult {
  redemption: RedeemedReward;
  pointsBalance: number;
}

// Raw backend rows (snake_case) from rewardsController.
interface RawReward {
  id: string;
  club_id: string;
  reward_name: string;
  description: string | null;
  points_required: number;
  reward_type: RewardType;
  value: string | number | null;
  image_url: string | null;
  quantity_available: number | null;
  quantity_redeemed: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RawRedeemedReward {
  id: string;
  reward_id: string;
  member_id: string;
  reward_name: string;
  description?: string | null;
  reward_type: RewardType;
  value: string | number | null;
  image_url?: string | null;
  points_spent: number;
  status: RedemptionStatus;
  redeemed_at: string;
  used_at: string | null;
  valid_until?: string | null;
  notes?: string | null;
}

function mapReward(raw: RawReward): Reward {
  return {
    id: raw.id,
    clubId: raw.club_id,
    name: raw.reward_name,
    description: raw.description || '',
    pointsRequired: raw.points_required,
    rewardType: raw.reward_type,
    value: Number(raw.value) || 0,
    imageUrl: raw.image_url || undefined,
    quantityAvailable: raw.quantity_available ?? undefined,
    quantityRedeemed: raw.quantity_redeemed || 0,
    validFrom: raw.valid_from || undefined,
    validUntil: raw.valid_until || undefined,
    isActive: raw.is_active,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapRedeemedReward(raw: RawRedeemedReward): RedeemedReward {
  return {
    id: raw.id,
    rewardId: raw.reward_id,
    memberId: raw.member_id,
    rewardName: raw.reward_name,
    description: raw.description || undefined,
    rewardType: raw.reward_type,
    value: Number(raw.value) || 0,
    imageUrl: raw.image_url || undefined,
    pointsSpent: raw.points_spent,
    status: raw.status,
    redeemedAt: raw.redeemed_at,
    usedAt: raw.used_at || undefined,
    validUntil: raw.valid_until || undefined,
    notes: raw.notes || undefined,
  };
}

/**
 * Get the active reward catalog for a club.
 */
export const getRewards = async (clubId: string): Promise<Reward[]> => {
  try {
    const response = await apiClient.get<ApiResponse<{ rewards: RawReward[] }>>(
      `/clubs/${clubId}/rewards`
    );
    return (response.data.data?.rewards || []).map(mapReward);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Redeem a reward for the currently authenticated member.
 * The backend derives the member from the auth token — no memberId is sent.
 */
export const redeemReward = async (
  clubId: string,
  rewardId: string
): Promise<RedeemResult> => {
  try {
    const response = await apiClient.post<
      ApiResponse<{ redemption: RawRedeemedReward; pointsBalance: number }>
    >(`/clubs/${clubId}/rewards/${rewardId}/redeem`);

    const data = response.data.data;
    if (!data) throw new Error('Redemption failed');

    return {
      redemption: mapRedeemedReward(data.redemption),
      pointsBalance: data.pointsBalance,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get the authenticated member's own redemption history.
 */
export const getMyRedeemedRewards = async (
  clubId: string
): Promise<RedeemedReward[]> => {
  try {
    const response = await apiClient.get<
      ApiResponse<{ redeemedRewards: RawRedeemedReward[] }>
    >(`/clubs/${clubId}/members/me/redeemed-rewards`);
    return (response.data.data?.redeemedRewards || []).map(mapRedeemedReward);
  } catch (error) {
    throw handleApiError(error);
  }
};
