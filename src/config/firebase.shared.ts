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
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

export const getVapidKey = (): string => {
  return import.meta.env.VITE_FIREBASE_VAPID_KEY;
};

/** Required keys for Firebase app + FCM. measurementId is optional. */
const REQUIRED_FIREBASE_KEYS: (keyof FirebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

/**
 * True when enough Vite Firebase env vars are present to initialize the SDK.
 * Local/devlocal often omits these — callers should skip FCM instead of failing.
 */
export const isFirebaseConfigured = (): boolean => {
  const config = getFirebaseConfig();
  return REQUIRED_FIREBASE_KEYS.every((key) => Boolean(config[key]));
};

/**
 * Utility: Verify config on startup
 */
export const verifyFirebaseConfig = (): void => {
  const config = getFirebaseConfig();
  const missingKeys = REQUIRED_FIREBASE_KEYS.filter((k) => !config[k]);

  if (missingKeys.length > 0) {
    console.warn(
      `⚠️ Firebase not configured (missing: ${missingKeys.join(', ')}). Push notifications disabled.`
    );
  } else {
    console.log('✅ Firebase configuration loaded successfully');
  }
};
