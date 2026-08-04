import { PortalShell } from '@/components/portal/PortalShell';
import { getPortalConfig } from '@/config/portal';
import { ROLES } from '@/utils/roles';
import { useAppSelector } from '@/module/store/hooks';

export function AdminLayout() {
  const roles = useAppSelector((s) => s.authReducer.user?.roles) ?? [];
  const role = roles.includes(ROLES.ADMIN) ? ROLES.ADMIN : ROLES.MODERATOR;
  return <PortalShell config={getPortalConfig(role)} />;
}
