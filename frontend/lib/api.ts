import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Error interface
export interface ApiErrorResponse {
  success: boolean;
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

// Get base URL from environment
const getBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }
  // Client-side
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Clear token and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Handle 403 - Forbidden
    if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        window.location.href = '/forbidden';
      }
    }

    // Handle 500 - Server error
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: unknown): ApiErrorResponse => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 500;
    const data = error.response?.data as ApiErrorResponse;

    return {
      success: false,
      error: data?.error || 'An error occurred',
      message: data?.message || error.message,
      statusCode: status,
      details: data?.details,
    };
  }

  return {
    success: false,
    error: 'Unknown error',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    statusCode: 500,
  };
};

// Helper function to extract data from response
export const getResponseData = <T = any>(response: AxiosResponse<ApiResponse<T>>): T | null => {
  return response.data.data || null;
};

// Export the configured axios instance
export default apiClient;
