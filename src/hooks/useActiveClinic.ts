import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { setActiveClinic } from '@/module/slice/AuthSlice';
import { ClinicModel, fetchMyClinics } from '@/services/clinicService';

/** Resolves the active clinic uuid + model for clinic portal pages. */
export function useActiveClinic() {
  const dispatch = useDispatch<AppDispatch>();
  const activeClinicId = useSelector((s: RootState) => s.authReducer.activeClinicId);
  const [clinics, setClinics] = useState<ClinicModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchMyClinics();
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

  const clinic = clinics.find((c) => c.uuid === activeClinicId) ?? clinics[0] ?? null;
  const clinicUuid = clinic?.uuid ?? activeClinicId;

  return { clinic, clinicUuid, clinics, loading, error };
}
