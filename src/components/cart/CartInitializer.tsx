import { useEffect, useRef, PropsWithChildren } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { initializeUserAndCart } from '@/module/slice/CartSlice';

export function CartInitializer({ children }: PropsWithChildren) {
  const dispatch = useDispatch<AppDispatch>();
  const { user: authUser, isAuthenticated } = useSelector((state: RootState) => state.authReducer);
  const { user: cartUser } = useSelector((state: RootState) => state.cartReducer);
  const initRef = useRef(false);

  useEffect(() => {
    const initCart = async () => {
      try {
        console.log('CartInitializer - Checking conditions:', {
          isAuthenticated,
          hasAuthUser: !!authUser,
          hasCartUser: !!cartUser,
          isInitialized: initRef.current
        });
        
        // Initialize cart only if user is authenticated and cart user is not set
        if (isAuthenticated && authUser && !cartUser && !initRef.current) {
          console.log('CartInitializer - Starting cart initialization');
          initRef.current = true;
          
          await dispatch(initializeUserAndCart()).unwrap();
          console.log('CartInitializer - Cart initialization complete');
        }
      } catch (error) {
        console.error('Cart initialization failed:', error);
        // Reset the ref on error so we can try again
        initRef.current = false;
      }
    };

    initCart();
  }, [dispatch, isAuthenticated, authUser, cartUser]); // Include all relevant dependencies

  return <>{children}</>;
} 