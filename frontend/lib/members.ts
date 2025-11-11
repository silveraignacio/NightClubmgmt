import apiClient, { ApiResponse, PaginatedResponse, handleApiError } from './api';

// Member Types
export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  joinDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  points: number;
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string;
  averageSpending: number;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberStats {
  totalVisits: number;
  totalSpent: number;
  averageSpending: number;
  lastVisit?: string;
  memberSince: string;
  currentTier: string;
  points: number;
  recentVisits: Array<{
    id: string;
    date: string;
    amount: number;
  }>;
}

export interface QRCodeResponse {
  memberId: string;
  memberName: string;
  qrCode: string; // Base64 encoded image
  qrCodeUrl: string; // URL to the QR code
}

export interface GetMembersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  tier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  sortBy?: 'name' | 'joinDate' | 'totalSpent' | 'visits';
  sortOrder?: 'asc' | 'desc';
}

// Members API calls

/**
 * Get all members for a club with pagination and filtering
 */
export const getMembers = async (
  clubId: string,
  params?: GetMembersParams
): Promise<PaginatedResponse<Member>> => {
  try {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Member>>>(
      `/clubs/${clubId}/members`,
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
 * Get a specific member by ID
 */
export const getMember = async (
  clubId: string,
  memberId: string
): Promise<Member> => {
  try {
    const response = await apiClient.get<ApiResponse<Member>>(
      `/clubs/${clubId}/members/${memberId}`
    );

    return response.data.data || ({} as Member);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get QR code for a member
 */
export const getMemberQRCode = async (
  clubId: string,
  memberId: string
): Promise<QRCodeResponse> => {
  try {
    const response = await apiClient.get<ApiResponse<QRCodeResponse>>(
      `/clubs/${clubId}/members/${memberId}/qr-code`
    );

    return response.data.data || ({} as QRCodeResponse);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get statistics for a member
 */
export const getMemberStats = async (
  clubId: string,
  memberId: string
): Promise<MemberStats> => {
  try {
    const response = await apiClient.get<ApiResponse<MemberStats>>(
      `/clubs/${clubId}/members/${memberId}/stats`
    );

    return response.data.data || ({} as MemberStats);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update member information
 */
export const updateMember = async (
  clubId: string,
  memberId: string,
  data: Partial<Member>
): Promise<Member> => {
  try {
    const response = await apiClient.put<ApiResponse<Member>>(
      `/clubs/${clubId}/members/${memberId}`,
      data
    );

    return response.data.data || ({} as Member);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Search members by name, email, or phone
 */
export const searchMembers = async (
  clubId: string,
  query: string
): Promise<Member[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Member[]>>(
      `/clubs/${clubId}/members/search`,
      { params: { q: query } }
    );

    return response.data.data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get members by tier
 */
export const getMembersByTier = async (
  clubId: string,
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
): Promise<Member[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Member[]>>(
      `/clubs/${clubId}/members/tier/${tier}`
    );

    return response.data.data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get members by status
 */
export const getMembersByStatus = async (
  clubId: string,
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
): Promise<Member[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Member[]>>(
      `/clubs/${clubId}/members/status/${status}`
    );

    return response.data.data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Export members list to CSV
 */
export const exportMembers = async (clubId: string): Promise<Blob> => {
  try {
    const response = await apiClient.get(
      `/clubs/${clubId}/members/export`,
      { responseType: 'blob' }
    );

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};
