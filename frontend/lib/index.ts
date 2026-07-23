// API Client
export { default as apiClient, handleApiError, getResponseData } from './api';
export type {
  ApiResponse,
  ApiErrorResponse,
  PaginatedResponse,
} from './api';

// Auth
// Auth is handled via the Zustand store (lib/store/authStore.ts) and the
// useAuth hook (lib/hooks/useAuth.ts) — not exported here to avoid a second,
// divergent auth API surface.

// Members
export {
  getMembers,
  getMember,
  getMemberByQr,
  getMemberQRCode,
  getMemberStats,
  updateMember,
  getMembershipTiers,
} from './members';
export type {
  Member,
  MemberStats,
  QRCodeResponse,
  MembershipTier,
  UpdateMemberData,
  GetMembersParams,
} from './members';

// Visits
export {
  createVisit,
  getVisits,
  getTodayVisitsCount,
  getMemberVisits,
} from './visits';
export type {
  Visit,
  CreateVisitData,
  GetVisitsParams,
} from './visits';

// Transactions
export {
  createTransaction,
  getTransactions,
  getTodayRevenue,
} from './transactions';
export type {
  Transaction,
  TransactionType,
  PaymentMethod,
  CreateTransactionData,
  GetTransactionsParams,
} from './transactions';

// Rewards
export {
  getRewards,
  getReward,
  createReward,
  updateReward,
  deleteReward,
  getMemberRedeemedRewards,
  getRedeemedRewards,
  redeemReward,
  markRewardAsUsed,
  getRewardCategories,
  getRewardsByCategory,
  searchRewards,
  exportRedeemedRewards,
} from './rewards';
export type {
  Reward,
  RedeemedReward,
  CreateRewardData,
  RedeemRewardData,
  GetRewardsParams,
  GetRedeemedRewardsParams,
} from './rewards';

// Metrics
export { getMemberMetrics } from './metrics';
export type { MemberMetricsSummary } from './metrics';
