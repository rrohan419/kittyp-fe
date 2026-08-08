import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from "./env";
import { Store } from '@reduxjs/toolkit';
import { Persistor } from 'redux-persist';
import { AppDispatch } from '@/module/store/store';

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

// Helper to clear all auth-related data
const clearAuthData = () => {
  // Clear localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('roles');

  // Clear Redux state if available
  if (dispatch && store) {
    try {
      dispatch({ type: 'auth/clearUser' });
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  }

  // Trigger storage event to sync across tabs
  window.dispatchEvent(new Event('storage'));
};

const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}`, // Your API base URL here
  timeout: 45000, // Timeout after 45 seconds
});


// Add the JWT token to the request header
axiosInstance.interceptors.request.use(
  (config) => {
    // Retrieve the token from storage (localStorage, sessionStorage, or cookies)
    const token = localStorage.getItem('access_token'); // or sessionStorage

    // If the token exists, add it to the Authorization header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

// Handle the response (you can add your logic to handle token expiration here)
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Only force re-auth on 401. 403 is a permission denial, not an expired session.
    // Never hard-redirect during public auth/signup flows — a 401 there is usually a
    // business error (e.g. OTP required), not an expired session.
    // Only clear the session when a token was actually sent — a bare 401 without a
    // token is not "logged out", and clearing would wipe any race-set credentials.
    if (error.response?.status === 401) {
      const hadToken = Boolean(error.config?.headers?.Authorization)
        || Boolean(localStorage.getItem('access_token'));
      if (
        hadToken &&
        typeof window !== 'undefined' &&
        !isPublicAuthPath(window.location.pathname)
      ) {
        clearAuthData();
        const redirect = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        window.location.href = `/login?redirect=${redirect}`;
      }
    }
    return Promise.reject(error);
  }
);

// axiosInstance.interceptors.request.use(request => {
//   console.log("Calling URL:", request.baseURL + request.url);
//   return request;
// });

export default axiosInstance;
