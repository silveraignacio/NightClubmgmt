import apiClient, { ApiResponse, PaginatedResponse, handleApiError } from './api';

// Visit Types
export interface Visit {
  id: string;
  memberId: string;
  clubId: string;
  memberName: string;
  checkInTime: string;
  checkOutTime?: string;
  duration?: number; // in minutes
  entryMethod: 'QR_CODE' | 'MANUAL' | 'ID_CARD';
  guestCount: number;
  amount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitData {
  memberId: string;
  checkInTime?: string;
  entryMethod: 'QR_CODE' | 'MANUAL' | 'ID_CARD';
  guestCount?: number;
  notes?: string;
}

export interface CheckOutData {
  checkOutTime?: string;
  notes?: string;
}

export interface VisitStats {
  today: number;
  week: number;
  month: number;
  total: number;
  averageGuestsPerVisit: number;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
}

export interface GetVisitsParams {
  page?: number;
  pageSize?: number;
  memberId?: string;
  startDate?: string;
  endDate?: string;
  entryMethod?: 'QR_CODE' | 'MANUAL' | 'ID_CARD';
  sortBy?: 'checkInTime' | 'memberName' | 'guestCount';
  sortOrder?: 'asc' | 'desc';
}

// Visits API calls

/**
 * Create a new visit check-in
 */
export const createVisit = async (
  clubId: string,
  data: CreateVisitData
): Promise<Visit> => {
  try {
    const response = await apiClient.post<ApiResponse<Visit>>(
      `/clubs/${clubId}/visits`,
      data
    );

    return response.data.data || ({} as Visit);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all visits for a club with pagination and filtering
 */
export const getVisits = async (
  clubId: string,
  params?: GetVisitsParams
): Promise<PaginatedResponse<Visit>> => {
  try {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Visit>>>(
      `/clubs/${clubId}/visits`,
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
 * Get a specific visit by ID
 */
export const getVisit = async (
  clubId: string,
  visitId: string
): Promise<Visit> => {
  try {
    const response = await apiClient.get<ApiResponse<Visit>>(
      `/clubs/${clubId}/visits/${visitId}`
    );

    return response.data.data || ({} as Visit);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get today's visit count
 */
export const getTodayVisitsCount = async (clubId: string): Promise<number> => {
  try {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      `/clubs/${clubId}/visits/stats/today`
    );

    return response.data.data?.count || 0;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get visit statistics
 */
export const getVisitStats = async (clubId: string): Promise<VisitStats> => {
  try {
    const response = await apiClient.get<ApiResponse<VisitStats>>(
      `/clubs/${clubId}/visits/stats`
    );

    return response.data.data || ({} as VisitStats);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Check out a member from a visit
 */
export const checkOutVisit = async (
  clubId: string,
  visitId: string,
  data?: CheckOutData
): Promise<Visit> => {
  try {
    const response = await apiClient.patch<ApiResponse<Visit>>(
      `/clubs/${clubId}/visits/${visitId}/checkout`,
      data || {}
    );

    return response.data.data || ({} as Visit);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get visits for a specific member
 */
export const getMemberVisits = async (
  clubId: string,
  memberId: string,
  params?: Omit<GetVisitsParams, 'memberId'>
): Promise<PaginatedResponse<Visit>> => {
  try {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Visit>>>(
      `/clubs/${clubId}/members/${memberId}/visits`,
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
 * Get active visits (current check-ins)
 */
export const getActiveVisits = async (clubId: string): Promise<Visit[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Visit[]>>(
      `/clubs/${clubId}/visits/active`
    );

    return response.data.data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get visits by date range
 */
export const getVisitsByDateRange = async (
  clubId: string,
  startDate: string,
  endDate: string
): Promise<Visit[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Visit[]>>(
      `/clubs/${clubId}/visits/date-range`,
      { params: { startDate, endDate } }
    );

    return response.data.data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update visit information
 */
export const updateVisit = async (
  clubId: string,
  visitId: string,
  data: Partial<Visit>
): Promise<Visit> => {
  try {
    const response = await apiClient.put<ApiResponse<Visit>>(
      `/clubs/${clubId}/visits/${visitId}`,
      data
    );

    return response.data.data || ({} as Visit);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete a visit record
 */
export const deleteVisit = async (
  clubId: string,
  visitId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete<
      ApiResponse<{ success: boolean; message: string }>
    >(`/clubs/${clubId}/visits/${visitId}`);

    return response.data.data || { success: true, message: 'Visit deleted' };
  } catch (error) {
    throw handleApiError(error);
  }
};
