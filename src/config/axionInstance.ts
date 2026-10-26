
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
  refreshToken?: string;
  data?: RefreshResponse;
  result?: RefreshResponse;
  payload?: RefreshResponse;
}

const REFRESH_ENDPOINT = '/api/v1/auth/refresh';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
});

// Separate client: refresh failures must not re-enter the main interceptor.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
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

const extractTokens = (responseData: unknown): {
  accessToken: string;
  refreshToken?: string;
} => {
  let current = responseData as RefreshResponse | null | undefined;

  // Supports common response wrappers such as:
  // { token, refreshToken }
  // { data: { token, refreshToken } }
  // { data: { data: { token, refreshToken } } }
  for (let depth = 0; depth < 5 && current; depth++) {
    const accessToken = current.token || current.accessToken;

    if (typeof accessToken === 'string' && accessToken.length > 0) {
      return {
        accessToken,
        refreshToken:
          typeof current.refreshToken === 'string'
            ? current.refreshToken
            : undefined,
      };
    }

    current = current.data || current.result || current.payload;
  }

  throw new Error(
    'Refresh response did not contain a valid access token.'
  );
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getAuthItem('refresh_token');

  if (!refreshToken) {
    throw new Error('Refresh token is missing.');
  }

  const response = await refreshClient.post(
    REFRESH_ENDPOINT,
    { refreshToken }
  );

  const tokens = extractTokens(response.data);

  // Store the new access token.
  setAuthItem('access_token', tokens.accessToken);

  // If the backend rotates refresh tokens, store the new one.
  // Otherwise, preserve the existing refresh token.
  if (tokens.refreshToken) {
    setAuthItem('refresh_token', tokens.refreshToken);
  }

  return tokens.accessToken;
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
    // refresh request, or when no refresh credential is available.
    if (!getAuthItem('refresh_token')) {
      redirectToLogin();
      return Promise.reject(error);
    }

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
