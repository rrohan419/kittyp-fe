import { PortalShell } from '@/components/portal/PortalShell';
import { getPortalConfig } from '@/config/portal';
import { ROLES } from '@/utils/roles';

export function DoctorLayout() {
  return <PortalShell config={getPortalConfig(ROLES.DOCTOR)} />;
}
