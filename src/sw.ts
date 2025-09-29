/// <reference lib="webworker" />
/* eslint-disable no-undef */

// self.__WB_MANIFEST will be injected by Workbox
declare const self: ServiceWorkerGlobalScope & typeof globalThis & { __WB_MANIFEST?: any };
declare const firebase: any;

// Import Workbox precaching helpers so the manifest reference is retained
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

// Reference the Vorkbox manifest so injectManifest can replace it by actually using it
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// Import Firebase compat libraries suitable for SW
importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js');

process.env.GOOGLE_APPLICATION_CREDENTIALS;


// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyAo-yrtZoh-g81XNoDVVnKTjeOw70e8Qbs",
  authDomain: "kittyp-419.firebaseapp.com",
  projectId: "kittyp-419",
  storageBucket: "kittyp-419.firebasestorage.app",
  messagingSenderId: "138926955560",
  appId: "1:138926955560:web:d6fae35d2f8f57368f691d",
  measurementId: "G-620MNCWFSG"
});

// Use Firebase Messaging compat library for service worker background messages
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload: any) => {
  console.log('[FCM SW] Received background message:', payload);
  const title = payload.notification?.title || 'Kittyp Notification';
  const options: NotificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    tag: 'kittyp-notification',
    requireInteraction: false,
    silent: false
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('install', () => {
  console.log('[SW] Installing service worker');
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(self.clients.claim());
});
