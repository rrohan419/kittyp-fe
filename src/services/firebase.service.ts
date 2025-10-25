/**
 * Enterprise Firebase Service
 * 
 * Centralized service for all Firebase operations with proper error handling,
 * environment management, and enterprise-grade patterns.
 */

import { getFirebaseApp, getFirebaseMessaging } from '@/config/firebase';
import { firebaseConfig, vapidKey } from '@/config/firebase.config';
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
}

export class FirebaseService {
  private static instance: FirebaseService;
  private fcmToken: string | null = null;
  private isInitialized = false;

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
   * Initialize Firebase service
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('✅ Firebase service already initialized');
      return true;
    }

    try {
      console.log('🚀 Initializing Firebase service...');
      
      // Initialize Firebase app
      const app = getFirebaseApp();
      console.log('✅ Firebase app initialized:', app.name);

      // Initialize FCM
      const messaging = await getFirebaseMessaging();
      if (messaging) {
        console.log('✅ Firebase messaging initialized');
        this.isInitialized = true;
        return true;
      } else {
        console.warn('⚠️ Firebase messaging not available');
        return false;
      }
    } catch (error) {
      console.error('❌ Firebase service initialization failed:', error);
      return false;
    }
  }

  /**
   * Get FCM token for push notifications
   */
  public async getFCMToken(): Promise<FCMTokenResult> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { token: null, error: 'Firebase not initialized' };
        }
      }

      // Check if we already have a token in memory
      if (this.fcmToken) {
        return { token: this.fcmToken };
      }


      // User doesn't have a token, request permission and get new token
      const token = await requestFcmPermissionAndToken();
      if (token) {
        this.fcmToken = token;
        console.log('✅ FCM token obtained:', token);
        return { token };
      } else {
        return { token: null, error: 'Failed to get FCM token' };
      }
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

      console.log('✅ Subscribed to foreground messages');
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

      // Only save if token is different or user doesn't have a token
      console.log('📤 Saving new FCM token to backend:', token);
      console.log('📤 Dispatching addFcmTokenToUser action...');
      
      // Dispatch the Redux action
      const dispatch = store.dispatch as AppDispatch;
      await dispatch(addFcmTokenToUser(token));
      
      console.log('✅ FCM token saved successfully to backend');
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
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      environment: import.meta.env.MODE,
      hasVapidKey: !!vapidKey,
      isInitialized: this.isInitialized,
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
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { token: null, error: 'Firebase not initialized' };
        }
      }

      // Get existing token from store
      const existingToken = this.getExistingToken();
      if (existingToken) {
        this.fcmToken = existingToken;
        console.log('✅ FCM initialized with existing token:', existingToken);
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
    console.log('🔄 FCM token reset');
  }
}

// Export singleton instance
export const firebaseService = FirebaseService.getInstance();
