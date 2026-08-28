import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { setActiveRole } from '@/module/slice/AuthSlice';
import { AppRole, canSwitchWorkspace, getContinueAsLabel, getPortalPath, getRoleLabel, PORTAL_HOME } from '@/utils/roles';
import {
  clearDefaultWorkspace,
  getDefaultWorkspace,
  resolvePreferredRole,
  setDefaultWorkspace,
} from '@/utils/workspacePreference';
import { getAuthItem } from '@/utils/authStorage';

interface LocationState {
  roles?: AppRole[];
}

const SelectRole = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: RootState) => state.authReducer);
  const rolesFromState = (location.state as LocationState)?.roles;
  const effectiveRoles = useMemo(() => {
    const storedRoles = JSON.parse(getAuthItem('roles') || 'null') as string[] | null;
    const roles = rolesFromState ?? (Array.isArray(storedRoles) ? storedRoles : authState.user?.roles ?? []);
    return Array.isArray(roles) ? roles.filter((role): role is AppRole => typeof role === 'string') : [];
  }, [rolesFromState, authState.user?.roles]);
  const [saveAsDefault, setSaveAsDefault] = useState(() => !!getDefaultWorkspace());

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

    // When switching roles intentionally, location.state.roles is set — do not auto-apply default.
    if (rolesFromState?.length) {
      return;
    }

    const preferred = resolvePreferredRole(effectiveRoles);
    if (preferred) {
      dispatch(setActiveRole(preferred));
      navigate(getPortalPath(preferred), { replace: true });
    }
  }, [effectiveRoles, workspaceRoles, navigate, dispatch, rolesFromState]);

  const handleRoleSelect = (role: AppRole) => {
    dispatch(setActiveRole(role));
    if (saveAsDefault) {
      setDefaultWorkspace(role);
    } else {
      clearDefaultWorkspace();
    }
    toast.success(getContinueAsLabel(role));
    navigate(getPortalPath(role), { replace: true });
  };

  if (!authState.isAuthenticated || !authState.user) {
    return null;
  }

  if (!canSwitchWorkspace(effectiveRoles) || workspaceRoles.length <= 1) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Choose your workspace</CardTitle>
              <CardDescription>
                You have more than one assigned role. Select which workspace to open.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workspaceRoles.map((role) => (
                <Button
                  key={role}
                  variant="secondary"
                  className="w-full text-left h-auto py-3"
                  onClick={() => handleRoleSelect(role)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{getContinueAsLabel(role)}</span>
                    <span className="text-sm text-muted-foreground">
                      {getRoleLabel(role)} · {getPortalPath(role)}
                    </span>
                  </div>
                </Button>
              ))}
              <label className="flex items-center gap-2 pt-1 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                />
                Save as default workspace
              </label>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
