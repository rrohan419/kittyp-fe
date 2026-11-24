import { PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState } from '@/module/store/store';
import { AppRole, ROLES, hasAnyRole } from '@/utils/roles';
import { resolvePostLoginTarget } from '@/utils/workspacePreference';
import { hasAuthToken } from '@/utils/authStorage';

export function PublicHomeGate({ children }: PropsWithChildren) {
  const location = useLocation();
  const { user, isAuthenticated, loading } = useSelector((s: RootState) => s.authReducer);
  const publicSiteRequested = new URLSearchParams(location.search).get('view') === 'public';

  if (loading && hasAuthToken()) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!publicSiteRequested && isAuthenticated && user
      && !hasAnyRole(user.roles, [ROLES.ADMIN, ROLES.MODERATOR])) {
    const roles = (user.roles || []).filter((r): r is AppRole => typeof r === 'string');
    const target = resolvePostLoginTarget(roles, user.uuid);
    if (target) return <Navigate to={target.path} replace />;
  }

  return <>{children}</>;
}
