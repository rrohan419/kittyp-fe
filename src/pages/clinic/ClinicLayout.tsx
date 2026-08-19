import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { PortalShell } from '@/components/portal/PortalShell';
import { getPortalConfig } from '@/config/portal';
import { RootState } from '@/module/store/store';
import { ROLES, hasRole } from '@/utils/roles';
import { useActiveClinic } from '@/hooks/useActiveClinic';

export function ClinicLayout() {
  const { user } = useSelector((state: RootState) => state.authReducer);
  const { isPersonalPractice } = useActiveClinic();
  const isAdmin = hasRole(user?.roles, ROLES.CLINIC_ADMIN);
  const role = isAdmin ? ROLES.CLINIC_ADMIN : ROLES.CLINIC_STAFF;
  const base = getPortalConfig(role);
  const config = useMemo(() => {
    if (isAdmin || !isPersonalPractice) {
      return base;
    }
    return {
      ...base,
      navItems: base.navItems.filter((item) => item.path !== '/clinic/doctors'),
      bottomTabs: base.bottomTabs.filter((item) => item.path !== '/clinic/doctors'),
    };
  }, [base, isAdmin, isPersonalPractice]);

  return <PortalShell config={config} />;
}
