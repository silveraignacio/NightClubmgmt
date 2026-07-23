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
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | string;
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
    description: string;
  }>;
}

export interface QRCodeResponse {
  memberId: string;
  memberName: string;
  qrCode: string; // Value to encode in a QR (the member's qrCodeId)
  qrCodeUrl: string; // Pre-rendered QR image (data URL) from the backend
}

export interface MembershipTier {
  id: string;
  tierName: string;
  description?: string;
  colorHex: string;
  pointsMultiplier: number;
  discountPercentage: number;
  entryCost: number;
  pointsRequired: number;
  sortOrder: number;
}

export interface GetMembersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  tier?: string;
  sortBy?: 'name' | 'joinDate' | 'totalSpent' | 'visits';
  sortOrder?: 'asc' | 'desc';
}

// The backend's raw club_members row (snake_case), optionally left-joined with
// its membership_tier. See database/schema.sql + membersController.ts.
interface RawMember {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  registration_date: string;
  points_balance: number;
  total_visits: number;
  total_spent: string | number;
  last_visit: string | null;
  tier_name: string | null;
  qr_code_id: string;
  created_at?: string;
  updated_at: string;
}

/**
 * Maps a raw backend club_members row to the frontend Member shape.
 * The schema has no active/suspended concept for members (see BACKLOG.md),
 * so every member returned by the API is treated as ACTIVE.
 */
function mapMember(raw: RawMember): Member {
  const [firstName, ...rest] = (raw.full_name || '').split(' ');
  const totalSpent = Number(raw.total_spent) || 0;
  const totalVisits = raw.total_visits || 0;

  return {
    id: raw.id,
    firstName: firstName || raw.full_name || '',
    lastName: rest.join(' '),
    email: raw.email,
    phone: raw.phone,
    dateOfBirth: raw.date_of_birth,
    joinDate: raw.registration_date || raw.created_at || raw.updated_at,
    status: 'ACTIVE',
    tier: (raw.tier_name || 'BRONZE').toUpperCase(),
    points: raw.points_balance || 0,
    totalVisits,
    totalSpent,
    lastVisit: raw.last_visit || undefined,
    averageSpending: totalVisits > 0 ? totalSpent / totalVisits : 0,
    createdAt: raw.created_at || raw.registration_date,
    updatedAt: raw.updated_at,
  };
}

// Members API calls

/**
 * Get all members for a club with pagination and filtering.
 * Backend supports `search` (name/email/phone) and `membershipType` server-side;
 * `tier`/`status` filters are applied client-side since the API doesn't accept them.
 */
export const getMembers = async (
  clubId: string,
  params?: GetMembersParams
): Promise<PaginatedResponse<Member>> => {
  try {
    const limit = params?.pageSize || 50;
    const page = params?.page || 1;
    const offset = (page - 1) * limit;

    const response = await apiClient.get<
      ApiResponse<{ members: RawMember[]; total: number; limit: number; offset: number }>
    >(`/clubs/${clubId}/members`, {
      params: { search: params?.search, limit, offset },
    });

    const data = response.data.data;
    if (!data) {
      return { data: [], total: 0, page: 1, pageSize: limit, totalPages: 0 };
    }

    let members = data.members.map(mapMember);

    if (params?.tier) {
      members = members.filter((m) => m.tier === params.tier);
    }
    if (params?.status) {
      members = members.filter((m) => m.status === params.status);
    }

    return {
      data: members,
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
 * Get a specific member by ID
 */
export const getMember = async (clubId: string, memberId: string): Promise<Member> => {
  try {
    const response = await apiClient.get<ApiResponse<{ member: RawMember }>>(
      `/clubs/${clubId}/members/${memberId}`
    );

    if (!response.data.data) throw new Error('Member not found');
    return mapMember(response.data.data.member);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get a member by their QR code ID (used by door/bar staff scanning a member's QR)
 */
export const getMemberByQr = async (clubId: string, qrCodeId: string): Promise<Member> => {
  try {
    const response = await apiClient.get<ApiResponse<{ member: RawMember }>>(
      `/clubs/${clubId}/members/by-qr/${encodeURIComponent(qrCodeId)}`
    );

    if (!response.data.data) throw new Error('Member not found');
    return mapMember(response.data.data.member);
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
    const response = await apiClient.get<
      ApiResponse<{ qrCodeId: string; qrCodeDataUrl: string; memberName: string }>
    >(`/clubs/${clubId}/members/${memberId}/qr-code`);

    const data = response.data.data;
    if (!data) return { memberId, memberName: '', qrCode: '', qrCodeUrl: '' };

    return {
      memberId,
      memberName: data.memberName,
      // `qrCode` is the raw value to encode (rendered client-side via QRDisplay),
      // so a scanner decodes it back to the same qrCodeId the backend understands.
      qrCode: data.qrCodeId,
      qrCodeUrl: data.qrCodeDataUrl,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get statistics for a member
 */
export const getMemberStats = async (clubId: string, memberId: string): Promise<MemberStats> => {
  try {
    const response = await apiClient.get<
      ApiResponse<{
        stats: {
          points_balance: number;
          total_visits: number;
          total_spent: string | number;
          last_visit: string | null;
          membership_type: string;
        };
        recentTransactions: Array<{
          description: string;
          amount: string | number;
          points_earned: number;
          transaction_date: string;
        }>;
      }>
    >(`/clubs/${clubId}/members/${memberId}/stats`);

    const data = response.data.data;
    if (!data) {
      return {
        totalVisits: 0,
        totalSpent: 0,
        averageSpending: 0,
        memberSince: new Date().toISOString(),
        currentTier: 'BRONZE',
        points: 0,
        recentVisits: [],
      };
    }

    const totalSpent = Number(data.stats.total_spent) || 0;
    const totalVisits = data.stats.total_visits || 0;

    return {
      totalVisits,
      totalSpent,
      averageSpending: totalVisits > 0 ? totalSpent / totalVisits : 0,
      lastVisit: data.stats.last_visit || undefined,
      memberSince: new Date().toISOString(),
      currentTier: (data.stats.membership_type || 'BRONZE').toUpperCase(),
      points: data.stats.points_balance || 0,
      recentVisits: (data.recentTransactions || []).map((t, i) => ({
        id: String(i),
        date: t.transaction_date,
        amount: Number(t.amount) || 0,
        description: t.description,
      })),
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

// Fields the backend actually accepts on update (membersController.updateMember's
// allowedFields: email, phone, full_name, profile_photo_url, notifications_enabled, sms_enabled).
export interface UpdateMemberData {
  fullName?: string;
  email?: string;
  phone?: string;
  profilePhotoUrl?: string;
  notificationsEnabled?: boolean;
  smsEnabled?: boolean;
}

/**
 * Update member information
 */
export const updateMember = async (
  clubId: string,
  memberId: string,
  data: UpdateMemberData
): Promise<Member> => {
  try {
    const response = await apiClient.patch<ApiResponse<{ member: RawMember }>>(
      `/clubs/${clubId}/members/${memberId}`,
      data
    );

    if (!response.data.data) throw new Error('Update failed');
    return mapMember(response.data.data.member);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get the club's membership tiers (for assigning a tier when registering a member)
 */
export const getMembershipTiers = async (clubId: string): Promise<MembershipTier[]> => {
  try {
    const response = await apiClient.get<
      ApiResponse<{
        tiers: Array<{
          id: string;
          tier_name: string;
          description?: string;
          color_hex: string;
          points_multiplier: string | number;
          discount_percentage: number;
          entry_cost: string | number;
          points_required: number;
          sort_order: number;
        }>;
      }>
    >(`/clubs/${clubId}/membership-tiers`);

    return (response.data.data?.tiers || []).map((t) => ({
      id: t.id,
      tierName: t.tier_name,
      description: t.description,
      colorHex: t.color_hex,
      pointsMultiplier: Number(t.points_multiplier),
      discountPercentage: t.discount_percentage,
      entryCost: Number(t.entry_cost),
      pointsRequired: t.points_required,
      sortOrder: t.sort_order,
    }));
  } catch (error) {
    throw handleApiError(error);
  }
};
