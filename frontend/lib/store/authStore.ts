/**
 * Authentication Store
 * Manages user authentication state using Zustand
 * Persists authentication token to localStorage
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios, { AxiosError } from "axios";
import {
  AuthState,
  User,
  AuthResponse,
  LoginData,
  RegisterData,
  ApiError,
} from "../types";

// API base URL - adjust based on your environment
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// Storage keys
const TOKEN_STORAGE_KEY = "auth_token";
const USER_STORAGE_KEY = "auth_user";

// Axios instance for auth requests
const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Zustand store for authentication state
 * Uses persist middleware to store token in localStorage
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * Set user in state
       */
      setUser: (user: User | null) => {
        set({ user });
      },

      /**
       * Set authentication token
       * Also updates axios default header
       */
      setToken: (token: string | null) => {
        set({ token });
        if (token) {
          authAPI.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
          delete authAPI.defaults.headers.common["Authorization"];
        }
      },

      /**
       * Set loading state
       */
      setIsLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      /**
       * Set error message
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Login with email and password
       * Sends credentials to auth endpoint and stores token
       */
      login: async (email: string, password: string) => {
        try {
          console.log('🔐 Login attempt:', email);
          set({ isLoading: true, error: null });

          // Validate inputs
          if (!email || !password) {
            throw new Error("Email and password are required");
          }

          // Make login request
          console.log('📡 Sending login request to:', `${API_BASE_URL}/api/auth/login`);
          const response = await authAPI.post<any>("/auth/login", {
            email,
            password,
          });

          console.log('✅ Login response:', response.data);

          const { user, token } = response.data.data;

          if (!user || !token) {
            console.error('❌ Invalid response structure:', response.data);
            throw new Error('Invalid response from server');
          }

          console.log('👤 User:', user);
          console.log('🔑 Token:', token.substring(0, 20) + '...');

          // Set authorization header
          authAPI.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${token}`;

          // Update state
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Manually save to localStorage as fallback
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth-token', token);
            localStorage.setItem('auth-user', JSON.stringify(user));
          }

          console.log('✅ Login successful, state updated');
          console.log('🔄 isAuthenticated:', true);
          console.log('💾 Saved to localStorage');

          return true;
        } catch (error) {
          console.error('❌ Login error:', error);
          const errorMessage = handleAuthError(error);
          console.error('❌ Error message:', errorMessage);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      },

      /**
       * Register a new user
       */
      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null });

          // Validate required fields
          if (
            !data.email ||
            !data.password ||
            !data.confirmPassword ||
            !data.fullName
          ) {
            throw new Error("All required fields must be filled");
          }

          // Validate password match
          if (data.password !== data.confirmPassword) {
            throw new Error("Passwords do not match");
          }

          // Validate password strength (minimum 8 characters)
          if (data.password.length < 8) {
            throw new Error("Password must be at least 8 characters long");
          }

          // Make registration request
          const response = await authAPI.post<any>(
            "/auth/register",
            {
              email: data.email,
              password: data.password,
              fullName: data.fullName,
              phone: data.phone,
            }
          );

          const { user, token } = response.data.data;

          // Update state
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Set authorization header
          authAPI.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${token}`;

          return true;
        } catch (error) {
          const errorMessage = handleAuthError(error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      },

      /**
       * Check if user is authenticated
       * Validates token with backend and restores session
       * Called on app initialization
       */
      checkAuth: async () => {
        try {
          const { token } = get();

          // If no token, user is not authenticated
          if (!token) {
            set({
              user: null,
              isAuthenticated: false,
              error: null,
            });
            return false;
          }

          // Set authorization header
          authAPI.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Verify token with backend
          const response = await authAPI.get<any>(
            "/auth/verify",
            {
              timeout: 5000,
            }
          );

          // Backend returns { status: 'success', data: { valid: true, user: {...} } }
          const user = response.data.data?.user;

          if (user) {
            set({
              user,
              isAuthenticated: true,
              error: null,
            });
            return true;
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error) {
          // Token is invalid or expired
          console.error('Auth check failed:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
          delete authAPI.defaults.headers.common["Authorization"];
          return false;
        }
      },

      /**
       * Logout user
       * Clears state and removes token from localStorage
       * Optionally notifies backend
       */
      logout: async () => {
        try {
          const { token } = get();

          // Notify backend of logout if token exists
          if (token) {
            try {
              await authAPI.post("/auth/logout", {}, {
                timeout: 3000,
              });
            } catch {
              // Continue logout even if backend call fails
              // User will be logged out on frontend
            }
          }

          // Clear state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });

          // Remove authorization header
          delete authAPI.defaults.headers.common["Authorization"];
        } catch (error) {
          // Even if logout fails, clear the state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          delete authAPI.defaults.headers.common["Authorization"];
        }
      },
    }),
    {
      name: "auth-store", // Name of the storage
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;

          // Try to get from auth-store first
          const storeData = localStorage.getItem(name);
          let parsedStore = null;

          if (storeData) {
            try {
              parsedStore = JSON.parse(storeData);
              // Check if store has valid data
              if (parsedStore?.state?.token && parsedStore?.state?.user) {
                console.log('✅ Loading from auth-store');
                return parsedStore;
              }
            } catch (e) {
              console.error('Failed to parse auth-store:', e);
            }
          }

          // Fallback: try to reconstruct from individual keys
          const token = localStorage.getItem('auth-token');
          const userStr = localStorage.getItem('auth-user');

          if (token && userStr) {
            try {
              const user = JSON.parse(userStr);
              console.log('✅ Loading from fallback keys (auth-token + auth-user)');
              const reconstructed = {
                state: {
                  token,
                  user,
                },
                version: 0
              };
              // Save reconstructed data to auth-store for next time
              localStorage.setItem(name, JSON.stringify(reconstructed));
              return reconstructed;
            } catch (e) {
              console.error('Failed to parse fallback auth data:', e);
            }
          }

          console.log('❌ No auth data found');
          return null;
        },
        setItem: (name, value) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(name, JSON.stringify(value));
            // Also save to fallback keys
            if (value?.state?.token) {
              localStorage.setItem('auth-token', value.state.token);
            }
            if (value?.state?.user) {
              localStorage.setItem('auth-user', JSON.stringify(value.state.user));
            }
          }
        },
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(name);
            localStorage.removeItem('auth-token');
            localStorage.removeItem('auth-user');
          }
        },
      },
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }) as any, // Persist token, user, and isAuthenticated
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('❌ Rehydration error:', error);
          return;
        }

        console.log('🔄 Rehydrating auth state:', state);

        // Set authorization header and isAuthenticated after hydration
        if (state?.token && state?.user) {
          authAPI.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${state.token}`;

          // IMPORTANT: Update isAuthenticated to true when we have valid credentials
          state.isAuthenticated = true;

          console.log('✅ Authorization header set from rehydration');
          console.log('✅ isAuthenticated set to true');
        }
      },
    }
  )
);

/**
 * Helper function to handle authentication errors
 * Converts various error types to user-friendly messages
 */
function handleAuthError(error: unknown): string {
  // Handle axios errors
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;

    // Handle specific error codes
    if (axiosError.response?.status === 401) {
      return "Invalid email or password";
    }

    if (axiosError.response?.status === 409) {
      return "Email already registered";
    }

    if (axiosError.response?.status === 422) {
      return "Invalid input data";
    }

    if (axiosError.response?.status === 500) {
      return "Server error. Please try again later";
    }

    // Return server error message if available
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    // Network error
    if (axiosError.message === "Network Error") {
      return "Network error. Please check your connection";
    }

    return axiosError.message || "An error occurred during authentication";
  }

  // Handle regular errors
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}

/**
 * Export API instance for use in other modules
 * Pre-configured with base URL and error handling
 */
export { authAPI };
