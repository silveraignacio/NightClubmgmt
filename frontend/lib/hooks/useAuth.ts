/**
 * useAuth Hook
 * Custom React hook for accessing authentication state and actions
 * Provides a simple interface to the authentication store
 */

import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { User, LoginData, RegisterData } from "../types";

/**
 * Custom hook for authentication
 * Automatically checks authentication status on component mount
 *
 * @returns Object containing auth state and actions
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * if (isAuthenticated) {
 *   return <div>Welcome, {user?.fullName}</div>;
 * }
 */
export function useAuth() {
  // Get state and actions from store
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setError = useAuthStore((state) => state.setError);
  const clearError = useAuthStore((state) => state.clearError);

  // Track if auth check has been performed
  const authCheckPerformed = useRef(false);

  /**
   * Check authentication on component mount
   * Only runs once per app instance
   */
  useEffect(() => {
    if (!authCheckPerformed.current) {
      authCheckPerformed.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  /**
   * Wrapped login function with error handling
   */
  const handleLogin = useCallback(
    async (email: string, password: string) => {
      try {
        clearError();
        await login(email, password);
        return true;
      } catch (err) {
        // Error is already set in store
        console.error("Login failed:", err);
        return false;
      }
    },
    [login, clearError]
  );

  /**
   * Wrapped register function with error handling
   */
  const handleRegister = useCallback(
    async (data: RegisterData) => {
      try {
        clearError();
        await register(data);
        return true;
      } catch (err) {
        // Error is already set in store
        console.error("Registration failed:", err);
        return false;
      }
    },
    [register, clearError]
  );

  /**
   * Wrapped logout function with error handling
   */
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      return true;
    } catch (err) {
      console.error("Logout failed:", err);
      return false;
    }
  }, [logout]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    checkAuth,
    clearError,
  };
}

/**
 * Hook to check if user has a specific role
 * Useful for role-based access control (RBAC)
 *
 * @param roles - Single role or array of roles to check
 * @returns Boolean indicating if user has any of the specified roles
 *
 * @example
 * const isManager = useHasRole(['club_owner', 'club_manager']);
 */
export function useHasRole(roles: string | string[]): boolean {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return false;
  }

  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
}

/**
 * Hook to check if user is authenticated
 * Shorthand for accessing authentication status
 *
 * @returns Boolean indicating if user is authenticated
 *
 * @example
 * const isAuthed = useIsAuthenticated();
 */
export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.isAuthenticated);
}

/**
 * Hook to get current user
 * Returns null if no user is authenticated
 *
 * @returns Current user object or null
 *
 * @example
 * const user = useUser();
 */
export function useUser(): User | null {
  return useAuthStore((state) => state.user);
}

/**
 * Hook to get authentication loading state
 * Useful for showing loading indicators during auth operations
 *
 * @returns Boolean indicating if auth operation is in progress
 *
 * @example
 * const isLoading = useAuthLoading();
 */
export function useAuthLoading(): boolean {
  return useAuthStore((state) => state.isLoading);
}

/**
 * Hook to get authentication error
 * Returns error message if auth operation failed
 *
 * @returns Error message or null
 *
 * @example
 * const error = useAuthError();
 */
export function useAuthError(): string | null {
  return useAuthStore((state) => state.error);
}
