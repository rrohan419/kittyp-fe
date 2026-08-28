import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/module/store/store';
import { setActiveRole } from '@/module/slice/AuthSlice';
import { AppRole, canSwitchWorkspace, hasAnyRole, getPortalHome, ROLES } from '@/utils/roles';

interface RoleGuardProps {
  allowed: AppRole | AppRole[];
  children: React.ReactNode;
}

/** When entering a portal the user is allowed into, sync activeRole to match. */
function SyncActiveRole({ role, children }: { role: AppRole; children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const activeRole = useSelector((s: RootState) => s.authReducer.activeRole);

  useEffect(() => {
    if (activeRole !== role) {
      dispatch(setActiveRole(role));
    }
  }, [activeRole, role, dispatch]);

  return <>{children}</>;
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

  // Multi-workspace accounts must pick a session context — except doctors default to doctor portal.
  if (canSwitchWorkspace(roles) && !activeRole) {
    if (roles.includes(ROLES.DOCTOR) && allowedRoles.includes(ROLES.DOCTOR)) {
      return <SyncActiveRole role={ROLES.DOCTOR}>{children}</SyncActiveRole>;
    }
    return <Navigate to="/select-role" replace state={{ roles, from: location.pathname }} />;
  }

  // Selected session role does not match this portal, but user holds an allowed role —
  // enter the portal and sync (fixes doctor stuck with activeRole=CLINIC_ADMIN).
  if (activeRole && !allowedRoles.includes(activeRole)) {
    const match = allowedRoles.find((r) => roles.includes(r));
    if (match) {
      return <SyncActiveRole role={match}>{children}</SyncActiveRole>;
    }
    if (roles.includes(activeRole)) {
      return <Navigate to={getPortalHome([activeRole])} replace />;
    }
    return <Navigate to="/select-role" replace state={{ roles }} />;
  }

  return <>{children}</>;
}
