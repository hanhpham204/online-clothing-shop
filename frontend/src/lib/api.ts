import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-CSRF-TOKEN';
let accessToken: string | null = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCsrfTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  const token = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${CSRF_COOKIE_NAME}=`))
    ?.split('=')[1];
  return token ?? null;
};

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const clearAccessToken = (): void => {
  accessToken = null;
};

export const sessionApi = {
  list: () => api.get('/sessions'),
  revoke: (sessionId: number, password: string) => api.delete(`/sessions/${sessionId}`, { data: { password } }),
  logoutAllOtherDevices: (password: string) => api.delete('/sessions/logout-all', { data: { password } }),
};

// Request interceptor — attach in-memory access token + CSRF for state-changing requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const method = (config.method || 'get').toUpperCase();
    if (config.headers && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken) {
        config.headers[CSRF_HEADER_NAME] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 with cookie-based refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/register')
      || requestUrl.includes('/auth/refresh')
      || requestUrl.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const csrfToken = getCsrfTokenFromCookie();
        const refreshHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (csrfToken) {
          refreshHeaders[CSRF_HEADER_NAME] = csrfToken;
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,
          headers: refreshHeaders,
        });

        const { accessToken } = response.data.data;
        setAccessToken(accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch {
        clearAccessToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
