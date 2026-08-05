/**
 * Firebase Client Initialization
 * 
 * Enterprise-grade Firebase setup with centralized configuration
 * and proper error handling.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';
import { firebaseConfig, isFirebaseConfigured } from './firebase.config';

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

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

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (messaging) return messaging;

  const app = getFirebaseApp();
  if (!app) return null;

  // Safari and some environments are not supported; guard to avoid runtime errors
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  messaging = getMessaging(app);
  return messaging;
} 