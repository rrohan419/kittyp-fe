import { useEffect, useRef, PropsWithChildren } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store';
import { initializeUserAndCart } from '@/module/slice/CartSlice';

export function CartInitializer({ children }: PropsWithChildren) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.cartReducer);
  const initRef = useRef(false);

  useEffect(() => {
    const initCart = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        console.log('CartInitializer - Checking conditions:', {
          hasAccessToken: !!accessToken,
          hasUser: !!user,
          isInitialized: initRef.current
        });
        
        // Initialize if we have a token and haven't initialized yet
        if (accessToken && !initRef.current) {
          console.log('CartInitializer - Starting initialization');
          initRef.current = true;
          await dispatch(initializeUserAndCart()).unwrap();
          console.log('CartInitializer - Initialization complete');
        }
      } catch (error) {
        console.error('Background cart sync failed:', error);
        // Reset the ref on error so we can try again
        initRef.current = false;
      }
    };

    initCart();
  }, [dispatch, user]); // Remove user?.uuid dependency to allow initial load

  return <>{children}</>;
} 