import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from "./env";

// Create an Axios instance
// const axiosInstance = axios.create({
//   baseURL: `${API_BASE_URL}/auth`, // Set your API base URL here
//   timeout: 10000, // Timeout after 10 seconds
// });

const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}`, // Your API base URL here
  timeout: 10000, // Timeout after 10 seconds
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
    // Check if error is due to JWT expiration
    if (error.response && error.response.status === 401) {
      // Optional: Handle token refresh or redirect to login
      console.log('Token expired or invalid, redirecting to login...');
      // Redirect or trigger token refresh (depending on your architecture)
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        // Optional: clear the invalid token to stop loops
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // window.location.href = '/login';
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
