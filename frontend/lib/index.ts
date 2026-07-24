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
  deleteMember,
  exportMembersCsv,
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
export { getRewards, redeemReward, getMyRedeemedRewards } from './rewards';
export type {
  Reward,
  RedeemedReward,
  RedeemResult,
  RewardType,
  RedemptionStatus,
} from './rewards';

// Metrics
export { getMemberMetrics, getRevenueMetrics, getEngagementMetrics } from './metrics';
export type {
  MemberMetricsSummary,
  RevenueMetrics,
  RevenueTrendPoint,
  EngagementMetrics,
  VisitTrendPoint,
} from './metrics';

// Clubs
export { getClub, updateClub } from './clubs';
export type { Club, UpdateClubData as UpdateClubSettingsData } from './clubs';

// Employees
export {
  getEmployees,
  getInvitations,
  inviteEmployee,
  revokeInvitation,
  deactivateEmployee,
} from './employees';
export type { Employee, Invitation as EmployeeInvitation, EmployeeRole } from './employees';

// Incidents
export { getIncidents, createIncident, resolveIncident } from './incidents';
export type { Incident, IncidentType, IncidentSeverity, CreateIncidentData } from './incidents';

// Events
export { getEvents, createEvent, deleteEvent } from './events';
export type { Event, CreateEventData as CreateEventFormData } from './events';

// VIP
export {
  getVipTables,
  createVipTable,
  getVipReservations,
  createVipReservation,
  updateVipReservationStatus,
} from './vip';
export type {
  VipTable,
  VipReservation,
  VipTableType,
  VipReservationStatus,
  CreateVipTableData,
  CreateVipReservationData,
} from './vip';
