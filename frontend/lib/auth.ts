import apiClient, { ApiResponse, handleApiError } from './api';

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'CLUB_OWNER' | 'MEMBER' | 'STAFF';
    clubId?: string;
    createdAt: string;
  };
}

export interface RegisterClubData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  clubName: string;
  location: string;
  phone: string;
  website?: string;
  businessLicense: string;
}

export interface RegisterClubResponse {
  token: string;
  refreshToken: string;
  club: {
    id: string;
    name: string;
    owner: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface RegisterMemberData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
}

export interface RegisterMemberResponse {
  token: string;
  refreshToken: string;
  member: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: LoginResponse['user'];
}

// Auth API calls

/**
 * Login with email and password
 */
export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/login',
      credentials
    );

    if (response.data.data) {
      // Store token and user info
      localStorage.setItem('authToken', response.data.data.token);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data.data || ({} as LoginResponse);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Register a new club
 */
export const registerClub = async (
  data: RegisterClubData
): Promise<RegisterClubResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<RegisterClubResponse>>(
      '/auth/register-club',
      data
    );

    if (response.data.data) {
      // Store token and user info
      localStorage.setItem('authToken', response.data.data.token);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('clubId', response.data.data.club.id);
    }

    return response.data.data || ({} as RegisterClubResponse);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Register a new member
 */
export const registerMember = async (
  data: RegisterMemberData
): Promise<RegisterMemberResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<RegisterMemberResponse>>(
      '/auth/register-member',
      data
    );

    if (response.data.data) {
      // Store token and user info
      localStorage.setItem('authToken', response.data.data.token);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.member));
    }

    return response.data.data || ({} as RegisterMemberResponse);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<LogoutResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<LogoutResponse>>(
      '/auth/logout'
    );

    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('clubId');

    return response.data.data || { success: true, message: 'Logged out successfully' };
  } catch (error) {
    // Even if the request fails, clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('clubId');

    throw handleApiError(error);
  }
};

/**
 * Verify if the stored token is valid
 */
export const verifyToken = async (): Promise<VerifyTokenResponse> => {
  try {
    const response = await apiClient.get<ApiResponse<VerifyTokenResponse>>(
      '/auth/verify'
    );

    return response.data.data || { valid: false };
  } catch (error) {
    return { valid: false };
  }
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): LoginResponse['user'] | null => {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Get auth token from localStorage
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('authToken'));
};
