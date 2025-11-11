import apiClient, { ApiResponse, PaginatedResponse, handleApiError } from './api';

// Transaction Types
export interface Transaction {
  id: string;
  memberId: string;
  clubId: string;
  memberName: string;
  visitId?: string;
  amount: number;
  currency: string;
  type: 'PURCHASE' | 'POINTS_REDEMPTION' | 'ADJUSTMENT' | 'REFUND';
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE' | 'POINTS';
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';
  itemsDescription?: string;
  staffId?: string;
  staffName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  memberId: string;
  amount: number;
  type: 'PURCHASE' | 'POINTS_REDEMPTION' | 'ADJUSTMENT' | 'REFUND';
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE' | 'POINTS';
  description: string;
  itemsDescription?: string;
  visitId?: string;
  notes?: string;
}

export interface TransactionStats {
  today: number;
  todayCount: number;
  week: number;
  weekCount: number;
  month: number;
  monthCount: number;
  total: number;
  totalCount: number;
  averageTransaction: number;
  paymentMethods: {
    [key in 'CASH' | 'CARD' | 'MOBILE' | 'POINTS']: {
      total: number;
      count: number;
    };
  };
  topItems?: Array<{
    description: string;
    count: number;
    total: number;
  }>;
}

export interface RevenueStats {
  today: number;
  todayVisits: number;
  todayAveragePerVisit: number;
  week: number;
  weekVisits: number;
  month: number;
  monthVisits: number;
  total: number;
  totalVisits: number;
  totalAverage: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendPercentage: number;
}

export interface GetTransactionsParams {
  page?: number;
  pageSize?: number;
  memberId?: string;
  type?: 'PURCHASE' | 'POINTS_REDEMPTION' | 'ADJUSTMENT' | 'REFUND';
  paymentMethod?: 'CASH' | 'CARD' | 'MOBILE' | 'POINTS';
  status?: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'createdAt' | 'amount' | 'memberName';
  sortOrder?: 'asc' | 'desc';
}

// Transactions API calls

/**
 * Create a new transaction
 */
export const createTransaction = async (
  clubId: string,
  data: CreateTransactionData
): Promise<Transaction> => {
  try {
    const response = await apiClient.post<ApiResponse<Transaction>>(
      `/clubs/${clubId}/transactions`,
      data
    );

    return response.data.data || ({} as Transaction);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all transactions for a club with pagination and filtering
 */
export const getTransactions = async (
  clubId: string,
  params?: GetTransactionsParams
): Promise<PaginatedResponse<Transaction>> => {
  try {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>(
      `/clubs/${clubId}/transactions`,
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
 * Get a specific transaction by ID
 */
export const getTransaction = async (
  clubId: string,
  transactionId: string
): Promise<Transaction> => {
  try {
    const response = await apiClient.get<ApiResponse<Transaction>>(
      `/clubs/${clubId}/transactions/${transactionId}`
    );

    return response.data.data || ({} as Transaction);
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
      `/clubs/${clubId}/transactions/stats/today-revenue`
    );

    return response.data.data?.revenue || 0;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get transaction statistics
 */
export const getTransactionStats = async (
  clubId: string
): Promise<TransactionStats> => {
  try {
    const response = await apiClient.get<ApiResponse<TransactionStats>>(
      `/clubs/${clubId}/transactions/stats`
    );

    return response.data.data || ({} as TransactionStats);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get revenue statistics
 */
export const getRevenueStats = async (clubId: string): Promise<RevenueStats> => {
  try {
    const response = await apiClient.get<ApiResponse<RevenueStats>>(
      `/clubs/${clubId}/transactions/stats/revenue`
    );

    return response.data.data || ({} as RevenueStats);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get transactions for a specific member
 */
export const getMemberTransactions = async (
  clubId: string,
  memberId: string,
  params?: Omit<GetTransactionsParams, 'memberId'>
): Promise<PaginatedResponse<Transaction>> => {
  try {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>(
      `/clubs/${clubId}/members/${memberId}/transactions`,
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
 * Get transactions for a specific visit
 */
export const getVisitTransactions = async (
  clubId: string,
  visitId: string
): Promise<Transaction[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Transaction[]>>(
      `/clubs/${clubId}/visits/${visitId}/transactions`
    );

    return response.data.data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update a transaction
 */
export const updateTransaction = async (
  clubId: string,
  transactionId: string,
  data: Partial<Transaction>
): Promise<Transaction> => {
  try {
    const response = await apiClient.put<ApiResponse<Transaction>>(
      `/clubs/${clubId}/transactions/${transactionId}`,
      data
    );

    return response.data.data || ({} as Transaction);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Refund a transaction
 */
export const refundTransaction = async (
  clubId: string,
  transactionId: string,
  reason?: string
): Promise<Transaction> => {
  try {
    const response = await apiClient.post<ApiResponse<Transaction>>(
      `/clubs/${clubId}/transactions/${transactionId}/refund`,
      { reason }
    );

    return response.data.data || ({} as Transaction);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get transactions by date range
 */
export const getTransactionsByDateRange = async (
  clubId: string,
  startDate: string,
  endDate: string
): Promise<Transaction[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Transaction[]>>(
      `/clubs/${clubId}/transactions/date-range`,
      { params: { startDate, endDate } }
    );

    return response.data.data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get transactions by payment method
 */
export const getTransactionsByPaymentMethod = async (
  clubId: string,
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE' | 'POINTS'
): Promise<Transaction[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Transaction[]>>(
      `/clubs/${clubId}/transactions/payment-method/${paymentMethod}`
    );

    return response.data.data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Export transactions to CSV
 */
export const exportTransactions = async (
  clubId: string,
  params?: GetTransactionsParams
): Promise<Blob> => {
  try {
    const response = await apiClient.get(
      `/clubs/${clubId}/transactions/export`,
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

/**
 * Delete a transaction
 */
export const deleteTransaction = async (
  clubId: string,
  transactionId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete<
      ApiResponse<{ success: boolean; message: string }>
    >(`/clubs/${clubId}/transactions/${transactionId}`);

    return response.data.data || { success: true, message: 'Transaction deleted' };
  } catch (error) {
    throw handleApiError(error);
  }
};
