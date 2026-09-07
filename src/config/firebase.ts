/**
 * Firebase Client Initialization
 * 
 * Enterprise-grade Firebase setup with centralized configuration
 * and proper error handling.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';
import { firebaseConfig, isFirebaseConfigured } from './firebase.config';

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let appCheck: AppCheck | null = null;

// App Check (reCAPTCHA v3) is enabled only when a site key is configured.
// Without it, the Firebase app still initializes but client-side FCM is
// unprotected against non-Attestation callers server-side. Keep the key in
// VITE_RECAPTCHA_SITE_KEY (public, safe) — never the secret.
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

export function getFirebaseApp(): FirebaseApp | null {
  if (firebaseApp) return firebaseApp;

  if (!isFirebaseConfigured()) {
    console.warn('⚠️ Firebase skipped: missing VITE_FIREBASE_* env vars');
    return null;
  }

  try {
    firebaseApp = initializeApp(firebaseConfig);
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return null;
  }
}

export function getFirebaseAppCheck(): AppCheck | null {
  if (appCheck) return appCheck;

  const app = getFirebaseApp();
  if (!app || !RECAPTCHA_SITE_KEY) return null;

  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    return appCheck;
  } catch (error) {
    console.error('❌ Firebase App Check initialization failed:', error);
    return null;
  }
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (messaging) return messaging;

  const app = getFirebaseApp();
  if (!app) return null;

  // Enable App Check (idempotent, env-gated) so FCM token requests carry an
  // attestation. Server (Admin SDK) verifies via App Check where enforced.
  getFirebaseAppCheck();

  // Safari and some environments are not supported; guard to avoid runtime errors
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  messaging = getMessaging(app);
  return messaging;
} 