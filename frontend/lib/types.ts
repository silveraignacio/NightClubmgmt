/**
 * Authentication and User Types
 * Defines the structure of user data and authentication state
 */

// Matches the backend's role vocabulary (see backend/src/middleware/auth.ts
// restrictTo usage and authService.ts) — club staff roles plus 'member' for
// customer logins.
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  DOORMAN = "doorman",
  BARTENDER = "bartender",
  SECURITY = "security",
  STAFF = "staff",
  MEMBER = "member",
}

/**
 * User object representing an authenticated user
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  clubId?: string;
  profileImage?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Authentication response from server
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Login request data
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Register request data
 */
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone?: string;
}

/**
 * Authentication state managed by Zustand
 */
export interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

/**
 * API Error response
 */
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}
