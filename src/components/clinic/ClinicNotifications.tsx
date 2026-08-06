import { PortalNotifications } from '@/components/portal/PortalNotifications';

/** Clinic-portal notifications (outbound invites + retention alerts). */
export function ClinicNotifications() {
  return <PortalNotifications basePath="/clinic" />;
}
