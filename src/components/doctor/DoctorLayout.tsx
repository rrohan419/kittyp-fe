import { useEffect, useMemo, useState } from 'react';
import { PortalShell } from '@/components/portal/PortalShell';
import { getPortalConfig } from '@/config/portal';
import { ROLES } from '@/utils/roles';
import { fetchMyDoctorProfile } from '@/services/doctorVerificationService';
import { useAppSelector } from '@/module/store/hooks';
import { specializationLabel } from '@/utils/specialization';

export function DoctorLayout() {
  const user = useAppSelector((s) => s.authReducer.user);
  const [subtitle, setSubtitle] = useState('Veterinarian');

  useEffect(() => {
    void fetchMyDoctorProfile()
      .then((profile) => {
        if (profile?.specialization) {
          setSubtitle(specializationLabel(profile.specialization) || 'Veterinarian');
        } else if (profile?.status) {
          setSubtitle(profile.status.replace(/_/g, ' ').toLowerCase());
        }
      })
      .catch(() => {
        /* keep default subtitle */
      });
  }, []);

  const config = useMemo(() => {
    const base = getPortalConfig(ROLES.DOCTOR);
    return {
      ...base,
      user: {
        ...base.user,
        subtitle,
      },
    };
  }, [subtitle, user?.firstName, user?.lastName]);

  return <PortalShell config={config} />;
}
