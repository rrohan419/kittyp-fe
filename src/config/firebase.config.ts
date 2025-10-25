/**
 * Firebase Configuration for Enterprise Application
 * 
 * This file centralizes all Firebase configuration to avoid conflicts
 * and provide a single source of truth for Firebase settings.
 */

import { getFirebaseConfig as getSharedFirebaseConfig, getVapidKey as getSharedVapidKey } from './firebase.shared';

// Re-export shared configuration
export const getFirebaseConfig = getSharedFirebaseConfig;
export const getVapidKey = getSharedVapidKey;

export const firebaseConfig = getFirebaseConfig();
export const vapidKey = getVapidKey();

// Service Worker configuration for dynamic generation
export const getServiceWorkerConfig = () => {
  const config = getFirebaseConfig();
  return {
    ...config,
    // Remove measurementId for service worker
    measurementId: undefined
  };
};
