import { useEffect, useMemo, useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { PortalShell } from '@/components/portal/PortalShell';
import { getPortalConfig } from '@/config/portal';
import { ROLES } from '@/utils/roles';
import { fetchMyDoctorProfile } from '@/services/doctorVerificationService';
import { useAppSelector } from '@/module/store/hooks';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { specializationLabel } from '@/utils/specialization';

const CLINIC_DOCTORS_NAV = {
  label: 'Doctors',
  path: '/doctor/doctors',
  icon: Stethoscope,
};

export function DoctorLayout() {
  const user = useAppSelector((s) => s.authReducer.user);
  const { clinic, loading: clinicLoading } = useActiveClinic();
  const [subtitle, setSubtitle] = useState('Veterinarian');
  // Personal practice (owned) never lists colleagues. Affiliated clinic switcher does.
  const showClinicDoctors = !clinicLoading && clinic?.personal === false;

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
    const navItems = showClinicDoctors
      ? insertAfterPath(base.navItems, '/doctor/patients', CLINIC_DOCTORS_NAV)
      : base.navItems;
    return {
      ...base,
      navItems,
      user: {
        ...base.user,
        subtitle,
      },
    };
  }, [subtitle, user?.firstName, user?.lastName, showClinicDoctors]);

  return <PortalShell config={config} />;
}

function insertAfterPath<T extends { path: string }>(items: T[], path: string, extra: T): T[] {
  const idx = items.findIndex((item) => item.path === path);
  if (idx < 0) {
    return [...items, extra];
  }
  return [...items.slice(0, idx + 1), extra, ...items.slice(idx + 1)];
}
