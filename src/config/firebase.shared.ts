/**
 * Firebase Configuration (Unified)
 *
 * ✅ Uses Vite environment variables for all environments.
 * ✅ Fully typed with safe fallbacks and validation.
 * ✅ Works in both React app and Service Worker context.
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

const getEnv = (key: string, fallback?: string): string => {
  const value = import.meta.env[key];
  if (!value && !fallback) {
    console.warn(`⚠️ Missing environment variable: ${key}`);
  }
  return value ?? fallback ?? "";
};

export const getFirebaseConfig = (): FirebaseConfig => ({
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID"),
});

export const getVapidKey = (): string => {
  return getEnv("VITE_FIREBASE_VAPID_KEY");
};

/**
 * Utility: Verify config on startup
 */
export const verifyFirebaseConfig = (): void => {
  const config = getFirebaseConfig();
  const missingKeys = Object.entries(config)
    .filter(([_, v]) => !v)
    .map(([k]) => k);

  if (missingKeys.length > 0) {
    console.error(`❌ Missing Firebase config keys: ${missingKeys.join(", ")}`);
  } else {
    console.log("✅ Firebase configuration loaded successfully");
  }
};
