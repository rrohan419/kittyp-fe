import { PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '@/module/store/store';
import { AppRole, ROLES, hasAnyRole } from '@/utils/roles';
import { resolvePostLoginTarget } from '@/utils/workspacePreference';
import { hasAuthToken } from '@/utils/authStorage';

/** Signed-in doctors, clinic users and pet parents land in their workspace instead of the marketing home. */
export function PublicHomeGate({ children }: PropsWithChildren) {
  const { user, isAuthenticated, loading } = useSelector((s: RootState) => s.authReducer);

  if (loading && hasAuthToken()) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (isAuthenticated && user && !hasAnyRole(user.roles, [ROLES.ADMIN, ROLES.MODERATOR])) {
    const roles = (user.roles || []).filter((r): r is AppRole => typeof r === 'string');
    const target = resolvePostLoginTarget(roles, user.uuid);
    if (target) {
      return <Navigate to={target.path} replace />;
    }
  }

  return <>{children}</>;
}
