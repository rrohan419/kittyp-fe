/**
 * Enterprise Firebase Service
 *
 * Centralized service for all Firebase operations with proper error handling,
 * environment management, and enterprise-grade patterns.
 */

import { getFirebaseApp, getFirebaseMessaging } from '@/config/firebase';
import { firebaseConfig, vapidKey, isFirebaseConfigured } from '@/config/firebase.config';
import { requestFcmPermissionAndToken, subscribeToForegroundMessages } from '@/lib/fcm';
import { addFcmTokenToUser } from '@/module/slice/AuthSlice';
import { store } from '@/module/store/store';
import { AppDispatch } from '@/module/store/store';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
}

export interface FCMTokenResult {
  token: string | null;
  error?: string;
  skipped?: boolean;
}

export class FirebaseService {
  private static instance: FirebaseService;
  private fcmToken: string | null = null;
  private isInitialized = false;
  private isSkipped = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Initialize Firebase service. Returns false when messaging is unavailable.
   * When config is missing (typical for local), marks as skipped instead of erroring.
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (!isFirebaseConfigured()) {
      this.isSkipped = true;
      console.warn('⚠️ Firebase skipped: VITE_FIREBASE_* not set for this mode');
      return false;
    }

    try {
      const app = getFirebaseApp();
      if (!app) {
        this.isSkipped = true;
        return false;
      }

      const messaging = await getFirebaseMessaging();
      if (messaging) {
        this.isInitialized = true;
        return true;
      }

      console.warn('⚠️ Firebase messaging not available in this browser');
      this.isSkipped = true;
      return false;
    } catch (error) {
      console.error('❌ Firebase service initialization failed:', error);
      return false;
    }
  }

  public wasSkipped(): boolean {
    return this.isSkipped;
  }

  /**
   * Get FCM token for push notifications
   */
  public async getFCMToken(): Promise<FCMTokenResult> {
    try {
      if (this.isSkipped || !isFirebaseConfigured()) {
        return { token: null, skipped: true, error: 'Firebase not configured' };
      }

      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            token: null,
            skipped: this.isSkipped,
            error: this.isSkipped ? 'Firebase not configured' : 'Firebase not initialized',
          };
        }
      }

      if (this.fcmToken) {
        return { token: this.fcmToken };
      }

      const token = await requestFcmPermissionAndToken();
      if (token) {
        this.fcmToken = token;
        return { token };
      }
      return { token: null, error: 'Failed to get FCM token' };
    } catch (error) {
      console.error('❌ FCM token error:', error);
      return { token: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Subscribe to foreground messages
   */
  public async subscribeToForegroundMessages(
    callback: (payload: NotificationPayload) => void
  ): Promise<boolean> {
    try {
      if (this.isSkipped || !isFirebaseConfigured()) {
        return false;
      }

      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return false;
        }
      }

      await subscribeToForegroundMessages((payload) => {
        callback({
          title: payload.title || 'Notification',
          body: payload.body || '',
          icon: payload.icon,
          data: payload.data,
        });
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to subscribe to foreground messages:', error);
      return false;
    }
  }

  /**
   * Send FCM token to backend (only if user doesn't already have this token)
   */
  public async sendTokenToBackend(token: string): Promise<boolean> {
    try {
      const dispatch = store.dispatch as AppDispatch;
      await dispatch(addFcmTokenToUser(token));
      return true;
    } catch (error) {
      console.error('❌ Failed to send token to backend:', error);
      return false;
    }
  }

  /**
   * Get current Firebase configuration info
   */
  public getConfigInfo() {
    return {
      projectId: firebaseConfig.projectId || '(not set)',
      authDomain: firebaseConfig.authDomain,
      environment: import.meta.env.MODE,
      hasVapidKey: !!vapidKey,
      isConfigured: isFirebaseConfigured(),
      isInitialized: this.isInitialized,
      isSkipped: this.isSkipped,
      hasToken: !!this.fcmToken,
    };
  }

  /**
   * Check if user already has an FCM token (without requesting permission)
   */
  public hasExistingToken(): boolean {
    const state = store.getState();
    const currentUser = state.authReducer.user;
    return !!(currentUser?.fcmToken || this.fcmToken);
  }

  /**
   * Check if we need to request permission or can use existing token
   */
  public shouldRequestPermission(): boolean {
    return !this.hasExistingToken();
  }

  /**
   * Get existing FCM token from store (without requesting permission)
   */
  public getExistingToken(): string | null {
    const state = store.getState();
    const currentUser = state.authReducer.user;
    return currentUser?.fcmToken || this.fcmToken || null;
  }

  /**
   * Initialize FCM with existing token (no permission request)
   */
  public async initializeWithExistingToken(): Promise<FCMTokenResult> {
    try {
      if (this.isSkipped || !isFirebaseConfigured()) {
        return { token: null, skipped: true, error: 'Firebase not configured' };
      }

      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            token: null,
            skipped: this.isSkipped,
            error: this.isSkipped ? 'Firebase not configured' : 'Firebase not initialized',
          };
        }
      }

      const existingToken = this.getExistingToken();
      if (existingToken) {
        this.fcmToken = existingToken;
        return { token: existingToken };
      }

      return { token: null, error: 'No existing FCM token found' };
    } catch (error) {
      console.error('❌ FCM initialization with existing token failed:', error);
      return { token: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Reset FCM token (useful for logout or token refresh)
   */
  public resetToken(): void {
    this.fcmToken = null;
  }
}

// Export singleton instance
export const firebaseService = FirebaseService.getInstance();
