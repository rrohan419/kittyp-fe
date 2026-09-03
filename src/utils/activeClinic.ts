import { ClinicModel, isClinicActivated } from '@/services/clinicService';

export const PIN_PENDING_CLINIC_KEY = 'kittyp:pinPendingClinic';

export type ClinicPick = Pick<ClinicModel, 'uuid' | 'name' | 'status' | 'personal'>;

export function isPendingClinicPinned(): boolean {
  try {
    return sessionStorage.getItem(PIN_PENDING_CLINIC_KEY) === '1';
  } catch {
    return false;
  }
}

export function setPendingClinicPinned(pinned: boolean): void {
  try {
    if (pinned) {
      sessionStorage.setItem(PIN_PENDING_CLINIC_KEY, '1');
    } else {
      sessionStorage.removeItem(PIN_PENDING_CLINIC_KEY);
    }
  } catch {
    /* private mode / blocked sessionStorage */
  }
}

/** Doctor portal only. Prefer a VERIFIED membership over a stored PENDING personal clinic. */
export function resolveActiveClinicId(
  list: ClinicPick[],
  stored: string | null | undefined,
  opts?: { pinPending?: boolean }
): string | null {
  if (!list.length) {
    return null;
  }

  const storedClinic = stored ? list.find((clinic) => clinic.uuid === stored) : undefined;
  if (storedClinic && isClinicActivated(storedClinic.status, storedClinic.personal)) {
    return storedClinic.uuid;
  }
  if (storedClinic && opts?.pinPending) {
    return storedClinic.uuid;
  }

  const verified = list
    .filter((clinic) => isClinicActivated(clinic.status, clinic.personal))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  if (verified[0]) {
    return verified[0].uuid;
  }
  if (storedClinic) {
    return storedClinic.uuid;
  }

  const personal = list.find((clinic) => clinic.personal);
  return (personal ?? list[0]).uuid;
}

export function isDoctorPortalPath(pathname?: string): boolean {
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  return path.startsWith('/doctor');
}
