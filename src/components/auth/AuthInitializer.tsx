import { useEffect, useRef, PropsWithChildren } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { AppDispatch, RootState } from '@/module/store/store';
import { validateAndSetUser } from '@/module/slice/AuthSlice';
import { getAuthItem } from '@/utils/authStorage';

export function AuthInitializer({ children }: PropsWithChildren) {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.authReducer);
  const initRef = useRef(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = getAuthItem('access_token');
        if (!accessToken) {
          initRef.current = false;
          tokenRef.current = null;
          return;
        }

        if (tokenRef.current !== accessToken) {
          initRef.current = false;
          tokenRef.current = accessToken;
        }

        if (!initRef.current && !isAuthenticated && !loading) {
          initRef.current = true;
          await dispatch(validateAndSetUser()).unwrap();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        initRef.current = false;
      }
    };

    void initAuth();
  }, [dispatch, isAuthenticated, loading, location.pathname]);

  return <>{children}</>;
}
