import { useEffect } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { firebaseApp } from '@/config/firebaseConfig';
import { saveFcmToken } from '@/services/notificationService';
import { useSelector } from 'react-redux';
import type { RootState } from '@/module/store/store';

const VAPID_KEY = 'VAPID_KEY';

export function FCMInitializer() {
  const { isAuthenticated } = useSelector((state: RootState) => state.authReducer);

  useEffect(() => {
    const setupFCM = async () => {
      try {
        const supported = await isSupported();
        if (!supported) {
          console.warn('[FCM] Messaging not supported in this browser');
          return;
        }
        if (!('serviceWorker' in navigator)) {
          console.warn('[FCM] Service worker not available in navigator');
          return;
        }

        console.log('[FCM] Setting up FCM...');
        
        // Wait for service worker to be ready (Vite PWA will register it)
        const registration = await navigator.serviceWorker.ready;
        
        if (!registration?.active) {
          console.error('[FCM] No active service worker found');
          return;
        }
        
        console.log('[FCM] Using SW:', registration.scope, registration.active?.scriptURL);

        const permission = await Notification.requestPermission();
        console.log('[FCM] Notification permission:', permission);
        if (permission !== 'granted') {
          console.warn('[FCM] Notification permission not granted');
          return;
        }

        const messaging = getMessaging(firebaseApp);
        console.log('[FCM] Getting token with service worker registration...', messaging);
        const token = await getToken(messaging, { 
          vapidKey: VAPID_KEY, 
          serviceWorkerRegistration: registration 
        });
        console.log('[FCM] Received token:', token ? token.substring(0, 12) + '...' : 'null');

        if (token) {
          localStorage.setItem('fcm_token', token);
          if (isAuthenticated) {
            try {
              await saveFcmToken(token);
              console.log('[FCM] Token saved to backend');
            } catch (e) {
              console.error('[FCM] Failed to save token to backend', e);
            }
          } else {
            console.log('[FCM] User not authenticated; skipping backend save');
          }
        } else {
          console.warn('[FCM] No token returned by getToken');
        }
      } catch (error: any) {
        console.error('FCM setup error:', error?.message || error);
      }
    };

    setupFCM();
  }, [isAuthenticated]);

  return null;
}
