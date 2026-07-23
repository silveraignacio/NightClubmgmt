import apiClient, { ApiResponse, PaginatedResponse, handleApiError } from './api';

// Visit Types
export interface Visit {
  id: string;
  memberId: string;
  clubId: string;
  memberName: string;
  checkInTime: string;
  checkOutTime?: string;
  entryMethod: 'QR_SCAN' | 'MANUAL' | 'LIST_ENTRY';
  guestCount: number;
  amount?: number;
  notes?: string;
  pointsEarned?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitData {
  qrCodeId: string;
  entryMethod?: 'qr_scan' | 'manual' | 'list_entry';
  entryType?: 'free_entry' | 'paid_entry' | 'vip_pass' | 'promotional';
  notes?: string;
}

export interface GetVisitsParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: 'checkInTime' | 'memberName' | 'guestCount';
  sortOrder?: 'asc' | 'desc';
}

// Raw backend visits row (snake_case), optionally joined with member/scanner names.
interface RawVisit {
  id: string;
  club_id: string;
  member_id: string;
  member_name?: string;
  entry_time: string;
  exit_time: string | null;
  entry_method: string;
  notes: string | null;
  points_earned: number;
  created_at: string;
}

const ENTRY_METHOD_MAP: Record<string, Visit['entryMethod']> = {
  qr_scan: 'QR_SCAN',
  manual: 'MANUAL',
  list_entry: 'LIST_ENTRY',
};

function mapVisit(raw: RawVisit, memberNameOverride?: string): Visit {
  return {
    id: raw.id,
    memberId: raw.member_id,
    clubId: raw.club_id,
    memberName: memberNameOverride || raw.member_name || '',
    checkInTime: raw.entry_time,
    checkOutTime: raw.exit_time || undefined,
    entryMethod: ENTRY_METHOD_MAP[raw.entry_method] || 'MANUAL',
    guestCount: 0, // the schema has no guest-count concept on visits
    notes: raw.notes || undefined,
    pointsEarned: raw.points_earned,
    createdAt: raw.created_at,
    updatedAt: raw.created_at,
  };
}

// Visits API calls

/**
 * Create a new visit check-in by resolving a member's QR code
 */
export const createVisit = async (clubId: string, data: CreateVisitData): Promise<Visit> => {
  try {
    const response = await apiClient.post<
      ApiResponse<{ visit: RawVisit; member: { fullName: string }; pointsEarned: number }>
    >(`/clubs/${clubId}/visits`, data);

    const result = response.data.data;
    if (!result) throw new Error('Failed to create visit');
    return mapVisit(result.visit, result.member?.fullName);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all visits for a club (most recent first)
 */
export const getVisits = async (
  clubId: string,
  params?: GetVisitsParams
): Promise<PaginatedResponse<Visit>> => {
  try {
    const limit = params?.pageSize || 50;
    const page = params?.page || 1;
    const offset = (page - 1) * limit;

    const response = await apiClient.get<
      ApiResponse<{ visits: RawVisit[]; total: number; limit: number; offset: number }>
    >(`/clubs/${clubId}/visits`, {
      params: { startDate: params?.startDate, endDate: params?.endDate, limit, offset },
    });

    const data = response.data.data;
    if (!data) return { data: [], total: 0, page: 1, pageSize: limit, totalPages: 0 };

    return {
      data: data.visits.map((v) => mapVisit(v)),
      total: data.total,
      page,
      pageSize: limit,
      totalPages: Math.max(1, Math.ceil(data.total / limit)),
    };
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
      `/clubs/${clubId}/visits/today/count`
    );

    return response.data.data?.count || 0;
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
  params?: Omit<GetVisitsParams, 'sortBy' | 'sortOrder'>
): Promise<PaginatedResponse<Visit>> => {
  try {
    const limit = params?.pageSize || 20;

    const response = await apiClient.get<ApiResponse<{ visits: RawVisit[] }>>(
      `/clubs/${clubId}/members/${memberId}/visits`,
      { params: { limit } }
    );

    const visits = response.data.data?.visits || [];
    return {
      data: visits.map((v) => mapVisit(v)),
      total: visits.length,
      page: 1,
      pageSize: limit,
      totalPages: 1,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};
