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
import { getMessaging } from "firebase/messaging/sw";

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
interface PushEvent extends Event {
  data?: {
    json(): any;
  };
  waitUntil(promise: Promise<any>): void;
}

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
    console.log('🔧 Service Worker Firebase Config:', firebaseConfig.projectId);
    
    const firebaseApp = initializeApp(firebaseConfig);
    const messaging = getMessaging(firebaseApp);
    
    console.log('✅ Firebase initialized in unified service worker');
    
    // Handle background messages
    self.addEventListener('push', (event: PushEvent) => {
      console.log('📱 Push event received:', event);
      
      if (event.data) {
        const payload = event.data.json();
        console.log('📱 Background message received:', payload);
        
        const notificationTitle = payload.notification?.title || "Kittyp Notification";
        const notificationOptions = {
          body: payload.notification?.body || "You have a new notification",
          icon: payload.notification?.icon || "/android-chrome-192x192.png",
          badge: "/android-chrome-192x192.png",
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
        
        event.waitUntil(
          self.registration.showNotification(notificationTitle, notificationOptions)
        );
      }
    });
    
  } catch (error) {
    console.error('❌ Firebase initialization failed in service worker:', error);
  }
};

// Initialize Firebase when service worker starts
initializeFirebase();

// Debug: Log manifest information
console.log('🔧 Service Worker Manifest:', self.__WB_MANIFEST);
console.log('🔧 Service Worker Environment:', import.meta.env.MODE);

// Allow offline navigation with fallback
let allowlist;
if (import.meta.env.DEV) {
  allowlist = [/^\/$/];
}

// Register navigation route with fallback
try {
  // Try to use createHandlerBoundToURL if index.html is precached
  if (self.__WB_MANIFEST && self.__WB_MANIFEST.some((entry: any) => entry.url === 'index.html')) {
    registerRoute(new NavigationRoute(
      createHandlerBoundToURL('index.html'),
      { allowlist },
    ));
  } else {
    // Fallback: use NetworkFirst strategy for navigation requests
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
  console.log('🔔 Notification clicked:', event);
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
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
  console.log('🔧 Unified Service Worker activated');
  event.waitUntil(Promise.resolve(clientsClaim()));
});

// Install event
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('🔧 Unified Service Worker installed');
  self.skipWaiting();
});
