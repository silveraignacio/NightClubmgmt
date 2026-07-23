import apiClient, { ApiResponse, handleApiError } from './api';

// Club Types
export interface Club {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  currentPlan: string;
  status: string;
  trialEndsAt?: string;
  membersCount: number;
  maxMembers: number;
  createdAt?: string;
  updatedAt?: string;
}

// Fields the backend actually accepts on update (clubsController.updateClub's
// allowedFields: name, email, phone, address, city, country, description,
// website, logo_url, cover_image_url).
export interface UpdateClubData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;
}

// The backend's raw clubs row (snake_case). See database/schema.sql + clubsController.ts.
interface RawClub {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  current_plan: string;
  status: string;
  trial_ends_at: string | null;
  members_count: number;
  max_members: number;
  created_at?: string;
  updated_at?: string;
}

function mapClub(raw: RawClub): Club {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email || undefined,
    phone: raw.phone || undefined,
    address: raw.address || undefined,
    city: raw.city || undefined,
    country: raw.country || undefined,
    description: raw.description || undefined,
    website: raw.website || undefined,
    logoUrl: raw.logo_url || undefined,
    coverImageUrl: raw.cover_image_url || undefined,
    currentPlan: raw.current_plan,
    status: raw.status,
    trialEndsAt: raw.trial_ends_at || undefined,
    membersCount: raw.members_count || 0,
    maxMembers: raw.max_members || 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * Get the club's own settings.
 * Backed by GET /clubs/:clubId (admin/manager only).
 */
export const getClub = async (clubId: string): Promise<Club> => {
  try {
    const response = await apiClient.get<ApiResponse<{ club: RawClub }>>(
      `/clubs/${clubId}`
    );

    if (!response.data.data) throw new Error('Club not found');
    return mapClub(response.data.data.club);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update the club's settings.
 * Backed by PATCH /clubs/:clubId (admin only).
 */
export const updateClub = async (
  clubId: string,
  data: UpdateClubData
): Promise<Club> => {
  try {
    const response = await apiClient.patch<ApiResponse<{ club: RawClub }>>(
      `/clubs/${clubId}`,
      data
    );

    if (!response.data.data) throw new Error('Update failed');
    return mapClub(response.data.data.club);
  } catch (error) {
    throw handleApiError(error);
  }
};
