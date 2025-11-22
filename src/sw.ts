/**
 * Unified Service Worker for PWA + Firebase Messaging
 * 
 * This service worker combines:
 * - VitePWA functionality (caching, offline support)
 * - Firebase Cloud Messaging (push notifications)
 */

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Service Worker types
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: any[];
  skipWaiting(): void;
  clients: any;
  location: Location;
  registration: ServiceWorkerRegistration;
  addEventListener(type: string, listener: EventListener): void;
};

// Event types for service worker
interface NotificationClickEvent extends Event {
  notification: Notification;
  action?: string;
  waitUntil(promise: Promise<any>): void;
}

interface MessageEvent extends Event {
  data?: {
    type?: string;
  };
}

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

// Precaching for PWA
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Use shared Firebase configuration (same as main app)
import { getFirebaseConfig } from './config/firebase.shared';

// Initialize Firebase in service worker
const initializeFirebase = async () => {
  try {
    const firebaseConfig = getFirebaseConfig();
    
    const firebaseApp = initializeApp(firebaseConfig);
    const messaging = getMessaging(firebaseApp);
    
    // Use Firebase's onBackgroundMessage handler to prevent duplicate notifications
    // This will handle all background messages and show notifications manually
    onBackgroundMessage(messaging, (payload) => {
      const notificationTitle = payload.notification?.title || "Kittyp Notification";
      const notificationOptions = {
        body: payload.notification?.body || "You have a new notification",
        icon: payload.notification?.icon || "/android-chrome-192x192.png",
        badge: "/android-chrome-192x192.png",
        image: payload.notification?.image,
        data: payload.data || {},
        requireInteraction: true,
        actions: [
          {
            action: 'open',
            title: 'Open App'
          },
          {
            action: 'close',
            title: 'Close'
          }
        ],
        tag: 'kittyp-notification',
        renotify: true
      };
      
      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
    
  } catch (error) {
    console.error('❌ Firebase initialization failed in service worker:', error);
  }
};

// Initialize Firebase when service worker starts
initializeFirebase();

// Allow offline navigation with fallback
let allowlist;
if (import.meta.env.DEV) {
  allowlist = [/^\/$/];
}

// Register navigation route with fallback
try {
  // Use createHandlerBoundToURL for navigation
  registerRoute(new NavigationRoute(
    createHandlerBoundToURL('index.html'),
    { allowlist },
  ));
} catch (error) {
  console.warn('Navigation route registration failed, using fallback:', error);
  // Ultimate fallback: simple network-first for navigation
  registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({
      cacheName: 'pages',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        }),
      ],
    })
  );
}

// PWA Caching Strategies
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://images.unsplash.com',
  new CacheFirst({
    cacheName: 'unsplash-images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://api.kittyp.in',
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Handle notification clicks
self.addEventListener('notificationclick', (event: NotificationClickEvent) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Get navigation path from notification data
        const notificationData = event.notification.data || {};
        const navigationPath = notificationData.url || notificationData.path || '/';
        
        // Ensure path starts with /
        const path = navigationPath.startsWith('/') ? navigationPath : `/${navigationPath}`;
        
        // If app is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Send message to navigate to the specific path
            client.postMessage({
              type: 'NAVIGATE',
              path: path
            });
            return client.focus();
          }
        }
        
        // Otherwise open new window with the navigation path
        if (self.clients.openWindow) {
          return self.clients.openWindow(path);
        }
      })
    );
  }
});

// Handle service worker updates
self.addEventListener('message', (event: MessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(Promise.resolve(clientsClaim()));
});

// Install event
self.addEventListener('install', (event: ExtendableEvent) => {
  self.skipWaiting();
});