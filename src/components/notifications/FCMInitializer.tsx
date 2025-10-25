import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/module/store/store';
import { firebaseService } from '@/services/firebase.service';
import { toast } from 'sonner';

export function FCMInitializer() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get authentication state from Redux
  const { isAuthenticated, user, loading: authLoading } = useSelector((state: RootState) => state.authReducer);

  useEffect(() => {
    const initializeFCM = async () => {
      // Only initialize FCM if user is authenticated and we haven't initialized yet
      if (!isAuthenticated || !user || isInitialized || authLoading) {
        return;
      }

      try {
        console.log('🚀 Initializing FCM for authenticated user...');
        setIsLoading(true);
        setError(null);

        // Initialize Firebase service
        const initialized = await firebaseService.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Firebase service');
        }


        // User doesn't have FCM token, request permission and get new token
      
        // Delay notification permission request by 3 seconds
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Get FCM token (this will request permission if needed)
        const tokenResult = await firebaseService.getFCMToken();
        setFcmToken(tokenResult.token);
        
        if (tokenResult.token) {
          console.log('✅ FCM token obtained for user:', user.email);
          console.log('🔑 FCM Token:', tokenResult.token);
          
          // Send token to backend
          console.log('📤 About to send token to backend...');
          const saveResult = await firebaseService.sendTokenToBackend(tokenResult.token);
          console.log('📤 Backend save result:', saveResult);
        } else {
          console.warn('⚠️ FCM token not obtained:', tokenResult.error);
          setError(tokenResult.error || 'Unknown error');
        }
        
        // Subscribe to foreground messages
        const subscribed = await firebaseService.subscribeToForegroundMessages(({ title, body }) => {
          console.log('📱 Foreground notification received');
          toast(title, { 
            description: body,
            duration: 5000,
          });
        });
        
        if (!subscribed) {
          console.warn('⚠️ Failed to subscribe to foreground messages');
        }
        
        setIsInitialized(true);
        
      } catch (error) {
        console.error('❌ FCM initialization failed:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeFCM();
  }, [isAuthenticated, user, isInitialized, authLoading]);

  // Reset FCM when user logs out
  useEffect(() => {
    if (!isAuthenticated && isInitialized) {
      console.log('🔄 User logged out, resetting FCM...');
      setFcmToken(null);
      setError(null);
      setIsInitialized(false);
      firebaseService.resetToken();
    }
  }, [isAuthenticated, isInitialized]);

  // Optional: Show FCM status in development
  if (import.meta.env.DEV) {
    const configInfo = firebaseService.getConfigInfo();
    
    // Determine status based on authentication and FCM state
    let status = 'Waiting for login';
    let bgColor = '#6b7280'; // gray
    
    if (isAuthenticated && user) {
      if (isLoading) {
        status = 'Initializing...';
        bgColor = '#f59e0b'; // yellow
      } else if (fcmToken) {
        status = '✅ Ready';
        bgColor = '#10b981'; // green
      } else if (error) {
        status = '❌ Failed';
        bgColor = '#ef4444'; // red
      } else {
        status = '⚠️ Not initialized';
        bgColor = '#f59e0b'; // yellow
      }
    }
    
    return (
      <div style={{ 
        position: 'fixed', 
        bottom: '10px', 
        right: '10px', 
        background: bgColor, 
        color: 'white', 
        padding: '8px 12px', 
        borderRadius: '4px', 
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px'
      }}>
        <div>FCM: {status}</div>
        <div style={{ fontSize: '10px', opacity: 0.8 }}>
          Auth: {isAuthenticated ? `✅ ${user?.email || 'User'}` : '❌ Not logged in'}
        </div>
        <div style={{ fontSize: '10px', opacity: 0.8 }}>
          {configInfo.projectId} ({configInfo.environment})
        </div>
        {error && (
          <div style={{ fontSize: '10px', opacity: 0.8 }}>
            Error: {error}
          </div>
        )}
      </div>
    );
  }

  return null;
}
