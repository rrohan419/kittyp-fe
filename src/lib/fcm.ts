import { onMessage, getToken, type Messaging } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/config/firebase';
import { vapidKey } from '@/config/firebase.config';

// Simple FCM token request with better error handling
export async function requestFcmPermissionAndToken(): Promise<string | null> {
  try {
    console.log('🔔 Starting FCM setup...');
    
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return null;
    }

    // Request notification permission
    let permission = Notification.permission;
    if (permission === 'default') {
      console.log('🔔 Requesting notification permission...');
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('Notification permission denied:', permission);
      return null;
    }

    console.log('✅ Notification permission granted');

    // Manually register the service worker (as per Stack Overflow approach)
    let registration;
    try {
      console.log('🔧 Manually registering service worker...');
      registration = await navigator.serviceWorker.register(
        import.meta.env.MODE === 'production' ? '/sw.js' : '/dev-sw.js?dev-sw',
        { type: import.meta.env.MODE === 'production' ? 'classic' : 'module' }
      );
      console.log('✅ Service worker registered successfully:', registration);
    } catch (swError) {
      console.error('❌ Service worker registration failed:', swError);
      return null;
    }

    // Get Firebase messaging
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.error('Firebase messaging not available');
      return null;
    }

    // Wait a bit for service worker to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get FCM token with serviceWorkerRegistration option
    try {
      const tokenOptions: any = {
        serviceWorkerRegistration: registration
      };
      
      // Only add vapidKey if it's available
      if (vapidKey) {
        tokenOptions.vapidKey = vapidKey;
        console.log('🔑 Using VAPID key for FCM token');
      } else {
        console.warn('⚠️ No VAPID key provided - FCM may not work properly');
        console.warn('Please configure VAPID key in firebase.config.ts');
      }
      const permission = Notification.permission;
      console.log('🔑 Notification permission:', permission);
      

      const token = await getToken(messaging, tokenOptions);
      
      if (token) {
        console.log('🎉 FCM Token obtained:', token);
        return token;
      } else {
        console.warn('No FCM token received');
        return null;
      }
    } catch (error) {
      console.error('❌ FCM token error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Registration failed')) {
          console.error('💡 This usually means:');
          console.error('   1. VAPID key doesn\'t match Firebase project');
          console.error('   2. Service worker configuration issue');
          console.error('   3. Firebase project settings mismatch');
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error('❌ FCM setup failed:', error);
    return null;
  }
}

// Listen for foreground messages
export async function subscribeToForegroundMessages(
  callback: (payload: { title?: string; body?: string; icon?: string; data?: Record<string, unknown> }) => void,
): Promise<() => void> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return () => {};
    
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📱 Foreground message received:', payload);
      const { notification, data } = payload;
      callback({
        title: notification?.title,
        body: notification?.body,
        icon: notification?.icon,
        data,
      });
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Foreground message subscription failed:', error);
    return () => {};
  }
}


