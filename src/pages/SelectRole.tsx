import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { setActiveRole } from '@/module/slice/AuthSlice';
import { AppRole, getRoleLabel, getPortalPath } from '@/utils/roles';

interface LocationState {
  roles?: AppRole[];
}

const SelectRole = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: RootState) => state.authReducer);
  const rolesFromState = (location.state as LocationState)?.roles;
  const storedRoles = JSON.parse(localStorage.getItem('roles') || 'null') as string[] | null;
  const roles = rolesFromState ?? (Array.isArray(storedRoles) ? storedRoles : authState.user?.roles ?? []);
  const effectiveRoles = Array.isArray(roles) ? roles.filter((role): role is AppRole => typeof role === 'string') : [];

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

    if (effectiveRoles.length === 1) {
      const singleRole = effectiveRoles[0];
      dispatch(setActiveRole(singleRole));
      navigate(getPortalPath(singleRole), { replace: true });
    }
  }, [effectiveRoles, navigate, dispatch]);

  const handleRoleSelect = (role: AppRole) => {
    dispatch(setActiveRole(role));
    toast.success(`Logged in as ${getRoleLabel(role)}`);
    navigate(getPortalPath(role), { replace: true });
  };

  if (!authState.isAuthenticated || !authState.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Choose your role</CardTitle>
              <CardDescription>
                You have more than one assigned role. Select the role you want to use for this session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {effectiveRoles.map((role) => (
                <Button
                  key={role}
                  variant="secondary"
                  className="w-full text-left"
                  onClick={() => handleRoleSelect(role)}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{getRoleLabel(role)}</span>
                    <span className="text-sm text-muted-foreground">{getPortalPath(role)}</span>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
