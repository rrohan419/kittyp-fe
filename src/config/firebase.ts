/**
 * Firebase Client Initialization
 * 
 * Enterprise-grade Firebase setup with centralized configuration
 * and proper error handling.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';
import { firebaseConfig } from './firebase.config';

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;

  try {
    firebaseApp = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully:', firebaseConfig.projectId);
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw new Error('Failed to initialize Firebase');
  }
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (messaging) return messaging;
  // Safari and some environments are not supported; guard to avoid runtime errors
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  
  messaging = getMessaging(getFirebaseApp());
  return messaging;
} 