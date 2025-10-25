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

export const getFirebaseConfig = (): FirebaseConfig => {
    // Check if we have environment variables
  const hasEnvVars = import.meta.env.VITE_FIREBASE_API_KEY && 
                     import.meta.env.VITE_FIREBASE_PROJECT_ID;
  
  if (!hasEnvVars) {
    console.warn('⚠️ Firebase environment variables not found. Using fallback configuration.');
    console.warn('⚠️ Please check your .env.devlocal file and restart the server.');
    
    // Return a fallback configuration that won't break the app
    return {
      apiKey: 'demo-api-key',
      authDomain: 'demo-project.firebaseapp.com',
      projectId: 'demo-project',
      storageBucket: 'demo-project.appspot.com',
      messagingSenderId: '123456789',
      appId: 'demo-app-id',
      measurementId: 'demo-measurement-id',
    };
  }

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  return config;
};

export const getVapidKey = (): string => {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('⚠️ VAPID key not found. Push notifications may not work properly.');
    return 'demo-vapid-key';
  }
  return vapidKey;
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
