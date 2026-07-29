import axios from 'axios';

import { siteConfig } from '@/config/site';
import { clearAccessToken, getAccessToken, setAccessToken } from './tokenStore';

/**
 * Shared axios instance.
 *
 * `withCredentials` is required for the HTTP-only refresh-token cookie to be
 * sent cross-origin (Next.js on :3000, Express on :5000).
 */
export const apiClient = axios.create({
  baseURL: siteConfig.apiUrl,
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set the multipart boundary itself.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

/**
 * Endpoints that must never trigger a refresh-and-retry cycle: a 401 from them
 * is the answer, not a recoverable expired-token condition.
 */
const NO_RETRY_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

const isRefreshable = (config) => {
  const url = config?.url || '';
  return !NO_RETRY_PATHS.some((path) => url.includes(path));
};

/**
 * Single-flight refresh. Concurrent 401s share one `/auth/refresh` call and
 * resume once it settles, instead of each firing their own.
 */
let refreshPromise = null;
let onSessionExpired = null;

/** Lets the auth layer clear Redux state when the session cannot be renewed. */
export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler;
};

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post('/auth/refresh')
      .then((response) => {
        const token = response.data?.data?.accessToken;
        if (!token) throw new Error('Refresh response did not include an access token');
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status === 401 && config && !config.__isRetry && isRefreshable(config)) {
      config.__isRetry = true;
      try {
        const token = await refreshAccessToken();
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
        return apiClient(config);
      } catch (refreshError) {
        clearAccessToken();
        if (typeof onSessionExpired === 'function') onSessionExpired();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Unwraps the API's success envelope so callers receive the payload directly.
 */
export const unwrap = (response) => response?.data?.data;

/**
 * Normalises any thrown value into a predictable shape for reducers and toasts.
 * Network failures and CORS rejections have no `response`, so they are reported
 * as a connectivity problem rather than an empty error.
 */
export const parseApiError = (error) => {
  const status = error?.response?.status ?? 0;
  const payload = error?.response?.data;

  if (payload && typeof payload === 'object') {
    return {
      status,
      message: payload.message || 'Request failed',
      errors: Array.isArray(payload.errors) ? payload.errors : [],
    };
  }

  if (error?.code === 'ECONNABORTED') {
    return { status, message: 'The request timed out. Please try again.', errors: [] };
  }

  return {
    status,
    message: status
      ? error?.message || 'Request failed'
      : 'Unable to reach the server. Check your connection and try again.',
    errors: [],
  };
};

export default apiClient;
