import { getSessionId, setSessionId } from '../lib/session';
import {
  AnalyzeRequest,
  AnalyzeResponse,
  HistoryResponse,
  HistoryItem,
  HealthResponse,
  ApiErrorResponse,
  UserResponse,
} from '../types/contract';

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const sessionId = getSessionId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-Id': sessionId,
    'X-Requested-With': 'XMLHttpRequest',
    ...(options.headers as Record<string, string>),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // If server returns a new X-Session-Id, update client storage
  const returnedSessionId = response.headers.get('X-Session-Id');
  if (returnedSessionId && returnedSessionId !== sessionId) {
    setSessionId(returnedSessionId);
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON response
    }

    const message = errorData?.error?.message || `Request failed with status ${response.status}`;
    const code = errorData?.error?.code || 'HTTP_ERROR';
    throw new ApiError(code, message, response.status, errorData?.error?.details);
  }

  return response.json() as Promise<T>;
}

export const api = {
  analyze: (data: AnalyzeRequest): Promise<AnalyzeResponse> => {
    return request<AnalyzeResponse>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getHistory: (page = 1, limit = 20): Promise<HistoryResponse> => {
    return request<HistoryResponse>(`/api/history?page=${page}&limit=${limit}`);
  },

  getHistoryItem: (id: string): Promise<HistoryItem> => {
    return request<HistoryItem>(`/api/history/${id}`);
  },

  deleteHistoryItem: (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/api/history/${id}`, {
      method: 'DELETE',
    });
  },

  clearHistory: (): Promise<{ deletedCount: number }> => {
    return request<{ deletedCount: number }>('/api/history', {
      method: 'DELETE',
    });
  },

  getHealth: (): Promise<HealthResponse> => {
    return request<HealthResponse>('/api/health');
  },

  // Auth Endpoints
  signup: (data: { email: string; password: string }): Promise<{ user: UserResponse }> => {
    return request<{ user: UserResponse }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: (data: { email: string; password: string }): Promise<{ user: UserResponse }> => {
    return request<{ user: UserResponse }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: (): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    });
  },

  getMe: (): Promise<{ user: UserResponse }> => {
    return request<{ user: UserResponse }>('/api/auth/me');
  },

  deleteAccount: (): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>('/api/auth/me', {
      method: 'DELETE',
    });
  },
};
