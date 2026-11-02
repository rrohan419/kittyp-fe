
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL } from './env';
import { Store } from '@reduxjs/toolkit';
import { Persistor } from 'redux-persist';
import { AppDispatch } from '@/module/store/store';
import {
  clearAuthStorage,
  getAuthItem,
  setAuthItem,
} from '@/utils/authStorage';

type CreateInstanceAndInjectStoreFunction = (
  _store: Store,
  _dispatch: AppDispatch,
  _persistor: Persistor
) => void;

let persistor: Persistor | undefined;
let store: Store | undefined;
let dispatch: AppDispatch | undefined;

export const createInstanceAndInjectStore: CreateInstanceAndInjectStoreFunction =
  (_store, _dispatch, _persistor) => {
    store = _store;
    persistor = _persistor;
    dispatch = _dispatch;
  };

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

interface RefreshResponse {
  token?: string;
  accessToken?: string;
  data?: RefreshResponse;
  result?: RefreshResponse;
  payload?: RefreshResponse;
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
});

// Separate client: refresh failures must not re-enter the main interceptor.
// The refresh token lives in an HttpOnly cookie, so credentials must be sent.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;
let logoutInProgress = false;

const clearAuthData = () => {
  clearAuthStorage();

  if (dispatch && store) {
    try {
      dispatch({ type: 'auth/clearUser' });
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  }

  // Retained because your existing setup injects the Redux Persistor.
  // Add persistor.purge() here only if you intentionally want to erase
  // all persisted Redux state, not just authentication state.
  void persistor;
};

const isPublicAuthPath = (pathname: string) => {
  const p = pathname || '';

  return (
    p === '/login' ||
    p.startsWith('/signup') ||
    p.startsWith('/doctor-signup') ||
    p.startsWith('/clinic-signup') ||
    p.startsWith('/forgot-password') ||
    p.startsWith('/reset-password')
  );
};

const isRefreshRequest = (url?: string) =>
  Boolean(url?.includes('/auth/refresh'));

const getAuthorizationHeader = (
  config?: InternalAxiosRequestConfig
): string | undefined => {
  if (!config?.headers) return undefined;

  // AxiosHeaders in Axios 1.x supports .get().
  const headers = config.headers as InternalAxiosRequestConfig['headers'] & {
    get?: (name: string) => unknown;
  };

  const value = headers.get
    ? headers.get('Authorization')
    : headers['Authorization'];

  return typeof value === 'string' ? value : undefined;
};

const extractAccessToken = (responseData: unknown): string => {
  let current = responseData as RefreshResponse | null | undefined;

  // Supports wrappers such as { token }, { data: { token } }, { data: { data: { token } } }
  for (let depth = 0; depth < 5 && current; depth++) {
    const accessToken = current.token || current.accessToken;

    if (typeof accessToken === 'string' && accessToken.length > 0) {
      return accessToken;
    }

    current = current.data || current.result || current.payload;
  }

  throw new Error(
    'Refresh response did not contain a valid access token.'
  );
};

const refreshAccessToken = async (): Promise<string> => {
  // The refresh token is sent automatically via the HttpOnly cookie.
  const response = await refreshClient.post('/auth/refresh');
  const accessToken = extractAccessToken(response.data);
  setAuthItem('access_token', accessToken);
  return accessToken;
};

const getNewAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const redirectToLogin = () => {
  if (typeof window === 'undefined' || logoutInProgress) return;

  logoutInProgress = true;
  clearAuthData();

  if (!isPublicAuthPath(window.location.pathname)) {
    const redirect = encodeURIComponent(
      window.location.pathname + window.location.search
    );

    window.location.href = `/login?redirect=${redirect}`;
  } else {
    logoutInProgress = false;
  }
};

// Attach the current access token to outgoing requests.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthItem('access_token');

    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// On 401, refresh the access token and retry the failed request once.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    const hadToken = Boolean(
      getAuthorizationHeader(originalRequest) ||
      getAuthItem('access_token')
    );

    if (
      !hadToken ||
      typeof window === 'undefined' ||
      isPublicAuthPath(window.location.pathname)
    ) {
      return Promise.reject(error);
    }

    // Do not try to refresh when the failed request is itself the
    originalRequest._retry = true;

    try {
      const newAccessToken = await getNewAccessToken();

      originalRequest.headers.set(
        'Authorization',
        `Bearer ${newAccessToken}`
      );

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
