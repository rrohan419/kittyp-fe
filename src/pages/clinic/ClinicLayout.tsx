import { useSelector } from 'react-redux';
import { PortalShell } from '@/components/portal/PortalShell';
import { getPortalConfig } from '@/config/portal';
import { RootState } from '@/module/store/store';
import { ROLES, hasRole } from '@/utils/roles';

export function ClinicLayout() {
  const { user } = useSelector((state: RootState) => state.authReducer);
  const role =
    hasRole(user?.roles, ROLES.CLINIC_STAFF) && !hasRole(user?.roles, ROLES.CLINIC_ADMIN)
      ? ROLES.CLINIC_STAFF
      : ROLES.CLINIC_ADMIN;

  return <PortalShell config={getPortalConfig(role)} />;
}
