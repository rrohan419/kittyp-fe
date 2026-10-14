import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppDispatch, RootState } from '@/module/store/store';
import { setActiveClinic } from '@/module/slice/AuthSlice';
import { ClinicModel, fetchMyClinics, fetchUserClinics } from '@/services/clinicService';
import { getAuthItem } from '@/utils/authStorage';
import {
  isDoctorPortalPath,
  isPendingClinicPinned,
  resolveActiveClinicId,
} from '@/utils/activeClinic';

const ACTIVE_CLINICS_QUERY_KEY = 'active-clinics';

async function loadActiveClinics(): Promise<ClinicModel[]> {
  let clinics: ClinicModel[] = [];
  try {
    clinics = await fetchMyClinics();
  } catch {
    clinics = await fetchUserClinics();
  }
  if (clinics.length) {
    return clinics;
  }
  try {
    return await fetchUserClinics();
  } catch {
    return [];
  }
}

/** Resolves the active clinic uuid + model for clinic portal pages. */
export function useActiveClinic() {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const activeClinicId = useSelector((s: RootState) => s.authReducer.activeClinicId);
  const userUuid = useSelector((s: RootState) => s.authReducer.user?.uuid);
  const doctorPortal = isDoctorPortalPath(location.pathname);
  const {
    data: clinics = [],
    error: queryError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [ACTIVE_CLINICS_QUERY_KEY, userUuid],
    queryFn: loadActiveClinics,
    enabled: Boolean(userUuid && getAuthItem('access_token')),
    staleTime: 30_000,
  });
  const visibleClinics = useMemo(
    () => doctorPortal ? clinics : clinics.filter((clinic) => !clinic.personal),
    [clinics, doctorPortal]
  );

  const refresh = useCallback(async () => {
    const result = await refetch();
    if (result.error) {
      throw result.error;
    }
    return result.data ?? [];
  }, [refetch]);

  useEffect(() => {
    const stored = getAuthItem('activeClinicId');
    const portalClinics = doctorPortal ? clinics : clinics.filter((clinic) => !clinic.personal);
    if (portalClinics.length) {
      const resolved = doctorPortal
        ? resolveActiveClinicId(portalClinics, stored, { pinPending: isPendingClinicPinned() })
        : stored && portalClinics.some((c) => c.uuid === stored)
          ? stored
          : portalClinics[0].uuid;
      if (resolved && resolved !== activeClinicId) {
        dispatch(setActiveClinic(resolved));
      }
    }
  }, [activeClinicId, clinics, dispatch, doctorPortal]);

  const clinicUuid =
    visibleClinics.length === 0
      ? null
      : doctorPortal
        ? resolveActiveClinicId(visibleClinics, activeClinicId, { pinPending: isPendingClinicPinned() })
        : activeClinicId && visibleClinics.some((c) => c.uuid === activeClinicId)
          ? activeClinicId
          : visibleClinics[0]?.uuid ?? null;
  const clinic = (clinicUuid ? visibleClinics.find((c) => c.uuid === clinicUuid) : null) ?? null;
  /** Doctor portal: Personal practice only (owned clinic). Affiliated switcher is not personal. */
  const isPersonalPractice = clinic?.personal === true;

  return {
    clinic,
    clinicUuid,
    clinics: visibleClinics,
    loading: isLoading,
    error: queryError instanceof Error ? queryError.message : queryError ? 'Failed to load clinics' : null,
    refresh,
    isPersonalPractice,
  };
}
