import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState } from '@/module/store/store';
import { AppRole, hasAnyRole, getPortalHome } from '@/utils/roles';

interface RoleGuardProps {
  allowed: AppRole | AppRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowed, children }: RoleGuardProps) {
  const { user, isAuthenticated, loading, activeRole } = useSelector((s: RootState) => s.authReducer);
  const location = useLocation();
  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!hasAnyRole(user.roles, allowedRoles)) {
    return <Navigate to={getPortalHome(user.roles)} replace />;
  }

  const roles = (user.roles || []).filter((r): r is AppRole => typeof r === 'string');

  // Multi-role accounts must pick a session context
  if (roles.length > 1 && !activeRole) {
    return <Navigate to="/select-role" replace state={{ roles, from: location.pathname }} />;
  }

  // Enforce the selected session role when present
  if (activeRole && !allowedRoles.includes(activeRole)) {
    if (roles.includes(activeRole)) {
      return <Navigate to={getPortalHome([activeRole])} replace />;
    }
    return <Navigate to="/select-role" replace state={{ roles }} />;
  }

  return <>{children}</>;
}
