import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { AppDispatch, RootState } from '@/module/store/store';
import { setActiveClinic } from '@/module/slice/AuthSlice';
import { ClinicModel, fetchMyClinics, fetchUserClinics } from '@/services/clinicService';
import { getAuthItem } from '@/utils/authStorage';
import {
  isDoctorPortalPath,
  isPendingClinicPinned,
  resolveActiveClinicId,
} from '@/utils/activeClinic';

/** Resolves the active clinic uuid + model for clinic portal pages. */
export function useActiveClinic() {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const activeClinicId = useSelector((s: RootState) => s.authReducer.activeClinicId);
  const [clinics, setClinics] = useState<ClinicModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const doctorPortal = isDoctorPortalPath(location.pathname);
  const visibleClinics = useMemo(
    () => doctorPortal ? clinics : clinics.filter((clinic) => !clinic.personal),
    [clinics, doctorPortal]
  );

  const refresh = useCallback(async () => {
    // Prefer /clinic/mine (owner + staff + doctor) — same as portal membership.
    let list: ClinicModel[] = [];
    try {
      list = await fetchMyClinics();
    } catch {
      list = await fetchUserClinics();
    }
    if (!list.length) {
      try {
        list = await fetchUserClinics();
      } catch {
        list = [];
      }
    }
    setClinics(list);
    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await refresh();
        if (cancelled) return;
        setError(null);
        const stored = getAuthItem('activeClinicId');
        const portalClinics = doctorPortal ? list : list.filter((clinic) => !clinic.personal);
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
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load clinics');
          setClinics([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, doctorPortal, location.pathname]);

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

  return { clinic, clinicUuid, clinics: visibleClinics, loading, error, refresh, isPersonalPractice };
}
