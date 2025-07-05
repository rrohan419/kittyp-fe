import { useEffect, useRef, PropsWithChildren } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { validateAndSetUser } from '@/module/slice/AuthSlice';
import { validateToken } from '@/services/authService';

export function AuthInitializer({ children }: PropsWithChildren) {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.authReducer);
  const initRef = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        console.log('AuthInitializer - Checking conditions:', {
          hasAccessToken: !!accessToken,
          isAuthenticated,
          loading,
          isInitialized: initRef.current
        });
        
        // Initialize if we have a token and haven't initialized yet
        if (accessToken && !initRef.current && !isAuthenticated && !loading) {
          console.log('AuthInitializer - Starting authentication');
          initRef.current = true;
          
          // Validate token and set user
          await dispatch(validateAndSetUser()).unwrap();
          console.log('AuthInitializer - Authentication complete');
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Reset the ref on error so we can try again
        initRef.current = false;
      }
    };

    initAuth();
  }, [dispatch, isAuthenticated, loading]); // Include auth state dependencies

  return <>{children}</>;
} 