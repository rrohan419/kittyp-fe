import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/module/store/store';
import { firebaseService } from '@/services/firebase.service';
import { isFirebaseConfigured } from '@/config/firebase.config';
import { toast } from 'sonner';

export function FCMInitializer() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { isAuthenticated, user, loading: authLoading } = useSelector(
    (state: RootState) => state.authReducer
  );

  useEffect(() => {
    const initializeFCM = async () => {
      if (!isAuthenticated || !user || isInitialized || authLoading) {
        return;
      }

      // Local/devlocal often has no VITE_FIREBASE_* — skip quietly
      if (!isFirebaseConfigured()) {
        setSkipped(true);
        setIsInitialized(true);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const initialized = await firebaseService.initialize();
        if (!initialized) {
          if (firebaseService.wasSkipped()) {
            setSkipped(true);
            setIsInitialized(true);
            return;
          }
          throw new Error('Failed to initialize Firebase service');
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));

        const tokenResult = await firebaseService.getFCMToken();
        setFcmToken(tokenResult.token);

        if (tokenResult.token) {
          await firebaseService.sendTokenToBackend(tokenResult.token);
        } else if (tokenResult.skipped) {
          setSkipped(true);
        } else {
          console.warn('⚠️ FCM token not obtained:', tokenResult.error);
          setError(tokenResult.error || 'Unknown error');
        }

        const subscribed = await firebaseService.subscribeToForegroundMessages(
          ({ title, body }) => {
            toast(title, {
              description: body,
              duration: 5000,
            });
          }
        );

        if (!subscribed) {
          console.warn('⚠️ Failed to subscribe to foreground messages');
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('❌ FCM initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeFCM();
  }, [isAuthenticated, user, isInitialized, authLoading]);

  useEffect(() => {
    if (!isAuthenticated && isInitialized) {
      setFcmToken(null);
      setError(null);
      setSkipped(false);
      setIsInitialized(false);
      firebaseService.resetToken();
    }
  }, [isAuthenticated, isInitialized]);

  if (import.meta.env.DEV) {
    const configInfo = firebaseService.getConfigInfo();

    let status = 'Waiting for login';
    let bgColor = '#6b7280';

    if (isAuthenticated && user) {
      if (isLoading) {
        status = 'Initializing...';
        bgColor = '#f59e0b';
      } else if (skipped || !configInfo.isConfigured) {
        status = '⏭️ Skipped (no config)';
        bgColor = '#6b7280';
      } else if (fcmToken) {
        status = '✅ Ready';
        bgColor = '#10b981';
      } else if (error) {
        status = '❌ Failed';
        bgColor = '#ef4444';
      } else {
        status = '⚠️ Not initialized';
        bgColor = '#f59e0b';
      }
    }

    return (
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: bgColor,
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 9999,
          maxWidth: '300px',
        }}
      >
        <div>FCM: {status}</div>
        <div style={{ fontSize: '10px', opacity: 0.8 }}>
          Auth: {isAuthenticated ? `✅ ${user?.email || 'User'}` : '❌ Not logged in'}
        </div>
        <div style={{ fontSize: '10px', opacity: 0.8 }}>
          {configInfo.projectId} ({configInfo.environment})
        </div>
        {error && !skipped && (
          <div style={{ fontSize: '10px', opacity: 0.8 }}>Error: {error}</div>
        )}
      </div>
    );
  }

  return null;
}
