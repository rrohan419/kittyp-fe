/// <reference types="vite/client" />


interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    // readonly VITE_API_BASE_URL_DEV: string;
    // readonly VITE_API_BASE_URL_PROD: string;
    readonly VITE_GOOGLE_SSO_URL_LOCAL: string;
    readonly VITE_GOOGLE_SSO_URL_DEV: string;
    // Add other environment variables as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }