# Firebase Setup Instructions

## Current Issue
The Firebase configuration is missing, which is causing the PWA install prompt to fail. Here's how to fix it:

## Step 1: Create Environment File
Create a `.env.local` file in your project root with the following content:

```env
# Firebase Configuration
# Replace these with your actual Firebase project configuration
# You can find these values in your Firebase Console > Project Settings > General

VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

## Step 2: Get Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on the web app icon (`</>`) or "Add app" if no web app exists
6. Copy the configuration values from the Firebase SDK snippet

## Step 3: Get VAPID Key (for Push Notifications)
1. In Firebase Console, go to Project Settings
2. Click on "Cloud Messaging" tab
3. Scroll down to "Web configuration"
4. Copy the "Key pair" value (this is your VAPID key)

## Step 4: Restart Development Server
After creating the `.env.local` file, restart your development server:

```bash
npm run dev
```

## Current Status
- ✅ PWA manifest is properly configured
- ✅ Service worker is working
- ✅ Firebase fallback configuration prevents crashes
- ⚠️ Firebase needs proper configuration for full functionality

## What's Fixed
1. **Firebase Configuration**: Added fallback configuration to prevent crashes
2. **Error Handling**: Firebase service now gracefully handles missing configuration
3. **PWA Install**: The PWA install prompt should now work without Firebase errors

## Testing
1. The app should now load without Firebase errors
2. PWA install prompt should appear (if other criteria are met)
3. Firebase features will work once you add proper configuration

## Note
The app will work without Firebase configuration, but push notifications and other Firebase features won't function until you add the proper environment variables.

