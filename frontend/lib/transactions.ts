import apiClient, { ApiResponse, PaginatedResponse, handleApiError } from './api';

export type TransactionType = 'drink_sale' | 'food_sale' | 'entry_fee' | 'table_service';
export type PaymentMethod = 'cash' | 'card' | 'points' | 'mixed';

// Transaction Types
export interface Transaction {
  id: string;
  memberId: string;
  clubId: string;
  memberName: string;
  amount: number;
  originalAmount: number;
  discountApplied: number;
  transactionType: TransactionType;
  paymentMethod: PaymentMethod;
  description: string;
  itemsDescription?: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'CANCELLED';
  pointsEarned: number;
  createdAt: string;
}

export interface CreateTransactionData {
  qrCodeId: string;
  transactionType: TransactionType;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  deviceId?: string;
}

export interface GetTransactionsParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

// Raw backend transactions row (snake_case), optionally joined with member name.
interface RawTransaction {
  id: string;
  club_id: string;
  member_id: string;
  member_name?: string;
  amount: string | number;
  original_amount: string | number;
  discount_applied: string | number;
  transaction_type: TransactionType;
  payment_method: PaymentMethod;
  description: string;
  status: string;
  points_earned: number;
  transaction_date: string;
}

function mapTransaction(raw: RawTransaction, memberNameOverride?: string): Transaction {
  return {
    id: raw.id,
    memberId: raw.member_id,
    clubId: raw.club_id,
    memberName: memberNameOverride || raw.member_name || '',
    amount: Number(raw.amount) || 0,
    originalAmount: Number(raw.original_amount) || 0,
    discountApplied: Number(raw.discount_applied) || 0,
    transactionType: raw.transaction_type,
    paymentMethod: raw.payment_method,
    description: raw.description,
    // the schema has a single `description` column; the item list *is* the description
    itemsDescription: raw.description,
    status: (raw.status || 'completed').toUpperCase() as Transaction['status'],
    pointsEarned: raw.points_earned || 0,
    createdAt: raw.transaction_date,
  };
}

// Transactions API calls

/**
 * Create a new transaction for a member (resolved by QR code)
 */
export const createTransaction = async (
  clubId: string,
  data: CreateTransactionData
): Promise<Transaction> => {
  try {
    const response = await apiClient.post<
      ApiResponse<{
        transaction: RawTransaction;
        member: { fullName: string };
        pricing: { originalAmount: number; discountApplied: number; finalAmount: number; pointsEarned: number };
      }>
    >(`/clubs/${clubId}/transactions`, data);

    const result = response.data.data;
    if (!result) throw new Error('Failed to create transaction');
    return mapTransaction(result.transaction, result.member?.fullName);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all transactions for a club (most recent first)
 */
export const getTransactions = async (
  clubId: string,
  params?: GetTransactionsParams
): Promise<PaginatedResponse<Transaction>> => {
  try {
    const limit = params?.pageSize || 50;
    const page = params?.page || 1;
    const offset = (page - 1) * limit;

    const response = await apiClient.get<
      ApiResponse<{ transactions: RawTransaction[]; totalAmount: number; limit: number; offset: number }>
    >(`/clubs/${clubId}/transactions`, {
      params: { startDate: params?.startDate, endDate: params?.endDate, limit, offset },
    });

    const data = response.data.data;
    if (!data) return { data: [], total: 0, page: 1, pageSize: limit, totalPages: 0 };

    const transactions = data.transactions.map((t) => mapTransaction(t));
    return {
      data: transactions,
      // The backend doesn't return a total record count for this list (only totalAmount),
      // so `total`/`totalPages` here are an approximation based on what's been fetched.
      total: offset + transactions.length,
      page,
      pageSize: limit,
      totalPages: transactions.length < limit ? page : page + 1,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get today's revenue
 */
export const getTodayRevenue = async (clubId: string): Promise<number> => {
  try {
    const response = await apiClient.get<ApiResponse<{ revenue: number }>>(
      `/clubs/${clubId}/transactions/today/revenue`
    );

    return response.data.data?.revenue || 0;
  } catch (error) {
    throw handleApiError(error);
  }
};
