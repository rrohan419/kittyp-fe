/// <reference types="vite/client" />


interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_GOOGLE_SSO_URL_LOCAL: string;
    readonly VITE_GOOGLE_SSO_URL_DEV: string;
    /** Phase 2 storefront. Default off for Phase 1 CRM. */
    readonly VITE_FEATURE_ECOMMERCE?: string;
    /** Alias for VITE_FEATURE_ECOMMERCE (ENABLE_STORE). */
    readonly VITE_ENABLE_STORE?: string;
    /** Razorpay Checkout key id (public). */
    readonly VITE_RAZORPAY_KEY_ID?: string;
    /** Show FCM debug overlay (email redacted). Default off. */
    readonly VITE_DEBUG_FCM?: string;
    /** MSG91 SECRET KEYS */
    readonly VITE_MSG91_TOKEN_AUTH?:string;
    readonly VITE_MSG91_WIDGET_ID?:string;
    // Add other environment variables as needed

  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
