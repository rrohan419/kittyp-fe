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

// Handle the response (you can add your logic to handle token expiration here)
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Check if error is due to JWT expiration or forbidden access
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Handle token refresh or redirect to login
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        // Clear all auth data
        clearAuthData();
        
        // Redirect to login
        window.location.href = '/login';
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
