/** Same-origin Vite proxy path. Local `npm start` has no .env.devlocal, so this must not be undefined. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const GOOGLE_SSO_URL = import.meta.env.VITE_GOOGLE_SSO_URL;
