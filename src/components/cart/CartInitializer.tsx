import { useEffect, useRef, PropsWithChildren } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { initializeUserAndCart } from '@/module/slice/CartSlice';

export function CartInitializer({ children }: PropsWithChildren) {
  const dispatch = useDispatch<AppDispatch>();
  const { user: authUser, isAuthenticated } = useSelector((state: RootState) => state.authReducer);
  const { user: cartUser } = useSelector((state: RootState) => state.authReducer);
  const initRef = useRef(false);

  useEffect(() => {
    const initCart = async () => {
      try {
        
        // Initialize cart only if user is authenticated and cart user is not set
        if (isAuthenticated && authUser && !cartUser && !initRef.current) {
          initRef.current = true;
          
          await dispatch(initializeUserAndCart()).unwrap();
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