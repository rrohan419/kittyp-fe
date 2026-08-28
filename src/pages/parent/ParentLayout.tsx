import { PortalShell } from '@/components/portal/PortalShell';
import { getPortalConfig } from '@/config/portal';
import { ROLES } from '@/utils/roles';

export function ParentLayout() {
  return <PortalShell config={getPortalConfig(ROLES.USER)} />;
}
