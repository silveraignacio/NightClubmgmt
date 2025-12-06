// API Client
export { default as apiClient, handleApiError, getResponseData } from './api';
export type {
  ApiResponse,
  ApiErrorResponse,
  PaginatedResponse,
} from './api';

// Auth
export {
  login,
  registerClub,
  registerMember,
  logout,
  verifyToken,
  getCurrentUser,
  getAuthToken,
  isAuthenticated,
} from './auth';
export type {
  LoginCredentials,
  LoginResponse,
  RegisterClubData,
  RegisterClubResponse,
  RegisterMemberData,
  RegisterMemberResponse,
  LogoutResponse,
  VerifyTokenResponse,
} from './auth';

// Members
export {
  getMembers,
  getMember,
  getMemberQRCode,
  getMemberStats,
  updateMember,
  searchMembers,
  getMembersByTier,
  getMembersByStatus,
  exportMembers,
} from './members';
export type {
  Member,
  MemberStats,
  QRCodeResponse,
  GetMembersParams,
} from './members';

// Visits
export {
  createVisit,
  getVisits,
  getVisit,
  getTodayVisitsCount,
  getVisitStats,
  checkOutVisit,
  getMemberVisits,
  getActiveVisits,
  getVisitsByDateRange,
  updateVisit,
  deleteVisit,
} from './visits';
export type {
  Visit,
  CreateVisitData,
  CheckOutData,
  VisitStats,
  GetVisitsParams,
} from './visits';

// Transactions
export {
  createTransaction,
  getTransactions,
  getTransaction,
  getTodayRevenue,
  getTransactionStats,
  getRevenueStats,
  getMemberTransactions,
  getVisitTransactions,
  updateTransaction,
  refundTransaction,
  getTransactionsByDateRange,
  getTransactionsByPaymentMethod,
  exportTransactions,
  deleteTransaction,
} from './transactions';
export type {
  Transaction,
  CreateTransactionData,
  TransactionStats,
  RevenueStats,
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
