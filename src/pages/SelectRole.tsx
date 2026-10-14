import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, PawPrint, ShieldCheck, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { setActiveRole } from '@/module/slice/AuthSlice';
import {
  AppRole,
  canSwitchWorkspace,
  getContinueAsLabel,
  getPortalPath,
  getRoleLabel,
  PORTAL_HOME,
} from '@/utils/roles';
import {
  resolvePreferredRole,
  setDefaultWorkspace,
} from '@/utils/workspacePreference';
import { getAuthItem } from '@/utils/authStorage';

interface LocationState {
  roles?: AppRole[];
  forceSelection?: boolean;
}

const SelectRole = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: RootState) => state.authReducer);
  const locationState = location.state as LocationState | null;
  const rolesFromState = locationState?.roles;
  const forceSelection = locationState?.forceSelection === true;
  const effectiveRoles = useMemo(() => {
    const storedRoles = JSON.parse(getAuthItem('roles') || 'null') as string[] | null;
    const roles = rolesFromState ?? (Array.isArray(storedRoles) ? storedRoles : authState.user?.roles ?? []);
    return Array.isArray(roles) ? roles.filter((role): role is AppRole => typeof role === 'string') : [];
  }, [rolesFromState, authState.user?.roles]);
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  const workspaceRoles = useMemo(() => {
    const seen = new Set<string>();
    return effectiveRoles.filter((role) => {
      const home = PORTAL_HOME[role];
      if (!home || seen.has(home)) return false;
      seen.add(home);
      return true;
    });
  }, [effectiveRoles]);

  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user) {
      navigate('/login', { replace: true });
    }
  }, [authState.isAuthenticated, authState.user, navigate]);

  useEffect(() => {
    if (!effectiveRoles.length) {
      navigate('/login', { replace: true });
      return;
    }

    if (workspaceRoles.length === 1) {
      const singleRole = workspaceRoles[0];
      dispatch(setActiveRole(singleRole));
      navigate(getPortalPath(singleRole), { replace: true });
      return;
    }

    // An intentional role switch must always show the chooser, regardless of saved defaults.
    if (forceSelection || rolesFromState?.length) {
      return;
    }

    const preferred = resolvePreferredRole(effectiveRoles);
    if (preferred) {
      dispatch(setActiveRole(preferred));
      navigate(getPortalPath(preferred), { replace: true });
    }
  }, [effectiveRoles, workspaceRoles, navigate, dispatch, rolesFromState, forceSelection]);

  const handleRoleSelect = (role: AppRole) => {
    dispatch(setActiveRole(role));
    if (saveAsDefault) {
      setDefaultWorkspace(role);
    }
    setSaveAsDefault(false);
    toast.success(getContinueAsLabel(role));
    navigate(getPortalPath(role), { replace: true });
  };

  const getRoleIcon = (role: AppRole) => {
    const key = String(role).toUpperCase();
    if (key.includes('DOCTOR')) return Stethoscope;
    if (key.includes('CLINIC') || key.includes('ORGANIZATION')) return Building2;
    if (key.includes('ADMIN')) return ShieldCheck;
    return PawPrint;
  };

  if (!authState.isAuthenticated || !authState.user) {
    return null;
  }

  if (!canSwitchWorkspace(effectiveRoles) || workspaceRoles.length <= 1) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Decorative background accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,hsl(var(--background))_75%)]" />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          {/* Brand header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <PawPrint className="h-7 w-7" aria-hidden />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Choose your workspace
            </h1>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              You have more than one assigned role. Select which workspace to open.
            </p>
          </div>

          {/* Role options */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
            {workspaceRoles.map((role) => {
              const Icon = getRoleIcon(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className="group flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">{getContinueAsLabel(role)}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {getRoleLabel(role)} · {getPortalPath(role)}
                    </span>
                  </span>
                  <ArrowRight
                    className="h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-foreground"
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>

          {/* Default workspace preference */}
          <label className="mt-6 flex cursor-pointer items-center justify-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-primary"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
            />
            Save as default workspace
          </label>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;