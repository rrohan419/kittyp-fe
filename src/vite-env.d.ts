/// <reference types="vite/client" />


interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    // readonly VITE_API_BASE_URL_DEV: string;
    // readonly VITE_API_BASE_URL_PROD: string;
    readonly VITE_GOOGLE_SSO_URL_LOCAL: string;
    readonly VITE_GOOGLE_SSO_URL_DEV: string;
    /** Google Maps JavaScript API key (Places Autocomplete). */
    readonly VITE_GOOGLE_MAPS_API_KEY?: string;
    /** Phase 2 storefront. Default off for Phase 1 CRM. */
    readonly VITE_FEATURE_ECOMMERCE?: string;
    /** Alias for VITE_FEATURE_ECOMMERCE (ENABLE_STORE). */
    readonly VITE_ENABLE_STORE?: string;
    /** Razorpay Checkout key id (public). */
    readonly VITE_RAZORPAY_KEY_ID?: string;
    /** Show FCM debug overlay (email redacted). Default off. */
    readonly VITE_DEBUG_FCM?: string;
    /** Meta / Facebook Login for Business app id (public). */
    readonly VITE_META_APP_ID?: string;
    /** Facebook Login for Business Embedded Signup configuration id. */
    readonly VITE_META_CONFIG_ID?: string;
    /** Alias for VITE_META_CONFIG_ID. */
    readonly VITE_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID?: string;
    // Add other environment variables as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
