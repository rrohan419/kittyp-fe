import { useEffect, useRef, PropsWithChildren } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { AppDispatch, RootState } from '@/module/store/store';
import { validateAndSetUser } from '@/module/slice/AuthSlice';
import { getAuthItem } from '@/utils/authStorage';

const isPublicAuthPath = (pathname: string) => {
  const p = pathname || '';
  return (
    p === '/login' ||
    p.startsWith('/signup') ||
    p.startsWith('/doctor-signup') ||
    p.startsWith('/clinic-signup') ||
    p.startsWith('/forgot-password') ||
    p.startsWith('/reset-password') ||
    p.startsWith('/verify-reset')
  );
};

export function AuthInitializer({ children }: PropsWithChildren) {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.authReducer);
  const initRef = useRef(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Do not auto-hydrate on login/signup — lets this tab switch accounts
        // without racing a stale /user/me from an inherited Duplicate-tab session.
        if (isPublicAuthPath(location.pathname)) {
          return;
        }

        const accessToken = getAuthItem('access_token');
        if (!accessToken) {
          initRef.current = false;
          tokenRef.current = null;
          return;
        }

        // Re-init when this tab's token changes (account switch)
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
