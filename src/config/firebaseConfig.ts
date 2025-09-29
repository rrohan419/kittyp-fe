// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "api_key",
  authDomain: "kittyp-419.firebaseapp.com",
  projectId: "kittyp-419",
  storageBucket: "kittyp-419.firebasestorage.app",
  messagingSenderId: "138926955560",
  appId: "1:138926955560:web:d6fae35d2f8f57368f691d",
  measurementId: "G-620MNCWFSG"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Analytics only when supported (e.g., not in SSR or SW)
export const initAnalytics = async () => {
  try {
    if (typeof window !== 'undefined' && await isAnalyticsSupported()) {
      return getAnalytics(firebaseApp);
    }
  } catch (_) {
    // no-op
  }
  return null;
};

export type FirebaseConfig = typeof firebaseConfig;
export const getFirebaseConfig = (): FirebaseConfig => firebaseConfig;
