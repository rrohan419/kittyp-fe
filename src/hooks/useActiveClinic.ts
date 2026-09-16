import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { setActiveClinic } from '@/module/slice/AuthSlice';
import { ClinicModel, fetchMyClinics, fetchUserClinics } from '@/services/clinicService';
import { getAuthItem } from '@/utils/authStorage';
import {
  isDoctorPortalPath,
  isPendingClinicPinned,
  resolveActiveClinicId,
} from '@/utils/activeClinic';
import { hasAnyRole, ROLES } from '@/utils/roles';

/** Roles allowed to call GET /clinic/mine (clinic membership portal API). */
const CLINIC_MINE_ROLES = [ROLES.DOCTOR, ROLES.CLINIC_ADMIN, ROLES.CLINIC_STAFF] as const;

/** Resolves the active clinic uuid + model for clinic portal pages. */
export function useActiveClinic() {
  const dispatch = useDispatch<AppDispatch>();
  const activeClinicId = useSelector((s: RootState) => s.authReducer.activeClinicId);
  const userRoles = useSelector((s: RootState) => s.authReducer.user?.roles);
  const storedRoles = useMemo(() => {
    if (userRoles?.length) return userRoles;
    try {
      const raw = getAuthItem('roles');
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : undefined;
    } catch {
      return undefined;
    }
  }, [userRoles]);
  const canFetchClinicMine = hasAnyRole(storedRoles, [...CLINIC_MINE_ROLES]);
  const [clinics, setClinics] = useState<ClinicModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    let list: ClinicModel[] = [];
    if (canFetchClinicMine) {
      // Prefer /clinic/mine (owner + staff + doctor) — same as portal membership.
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
    } else {
      // Pet parents (and others): only /user/clinics — never hit /clinic/mine (403).
      try {
        list = await fetchUserClinics();
      } catch {
        list = [];
      }
    }
    setClinics(list);
    return list;
  }, [canFetchClinicMine]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await refresh();
        if (cancelled) return;
        setError(null);
        const stored = getAuthItem('activeClinicId');
        if (list.length) {
          const resolved = isDoctorPortalPath()
            ? resolveActiveClinicId(list, stored, { pinPending: isPendingClinicPinned() })
            : stored && list.some((c) => c.uuid === stored)
              ? stored
              : list[0].uuid;
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
  }, [dispatch, refresh]);

  const clinicUuid =
    clinics.length === 0
      ? null
      : isDoctorPortalPath()
        ? resolveActiveClinicId(clinics, activeClinicId, { pinPending: isPendingClinicPinned() })
        : activeClinicId && clinics.some((c) => c.uuid === activeClinicId)
          ? activeClinicId
          : clinics[0]?.uuid ?? null;
  const clinic = (clinicUuid ? clinics.find((c) => c.uuid === clinicUuid) : null) ?? null;
  /** Doctor portal: Personal practice only (owned clinic). Affiliated switcher is not personal. */
  const isPersonalPractice = clinic?.personal === true;

  return { clinic, clinicUuid, clinics, loading, error, refresh, isPersonalPractice };
}
