import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { setActiveClinic } from '@/module/slice/AuthSlice';
import { ClinicModel, fetchUserClinics } from '@/services/clinicService';

/** Resolves the active clinic uuid + model for clinic portal pages. */
export function useActiveClinic() {
  const dispatch = useDispatch<AppDispatch>();
  const activeClinicId = useSelector((s: RootState) => s.authReducer.activeClinicId);
  const [clinics, setClinics] = useState<ClinicModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const list = await fetchUserClinics();
    setClinics(list);
    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchUserClinics();
        if (cancelled) return;
        setClinics(list);
        setError(null);
        const stored = localStorage.getItem('activeClinicId');
        if (list.length) {
          const stillValid = stored && list.some((c) => c.uuid === stored);
          if (!stillValid) {
            dispatch(setActiveClinic(list[0].uuid));
          } else if (!activeClinicId) {
            dispatch(setActiveClinic(stored));
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
    // Load once on mount; activeClinicId updates come from Redux/localStorage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const clinicUuid = activeClinicId ?? clinics[0]?.uuid ?? null;
  const clinic = (clinicUuid ? clinics.find((c) => c.uuid === clinicUuid) : null) ?? null;

  return { clinic, clinicUuid, clinics, loading, error, refresh };
}
