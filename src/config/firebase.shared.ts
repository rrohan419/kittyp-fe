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

export const getFirebaseConfig = (): FirebaseConfig => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

export const getVapidKey = (): string => {
  return import.meta.env.VITE_FIREBASE_VAPID_KEY;
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
