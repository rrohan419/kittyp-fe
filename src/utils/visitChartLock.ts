import { isValid, parseISO } from 'date-fns';
import type { ClinicVisitModel } from '@/services/clinicService';

/** After finish treatment, prescription/chart stay editable for one hour. */
export const PRESCRIPTION_EDIT_MS = 60 * 60 * 1000;

export function visitDoneAt(visit: Pick<ClinicVisitModel, 'checkingOutAt' | 'completedAt'>): Date | null {
  const raw = visit.checkingOutAt || visit.completedAt;
  if (!raw) return null;
  const at = parseISO(raw);
  return isValid(at) ? at : null;
}

export function canEditVisitChart(visit: ClinicVisitModel | null | undefined): boolean {
  if (!visit) return false;
  const status = visit.status;
  if (status === 'CANCELLED' || status === 'NO_SHOW') return false;
  if (status === 'WAITLIST' || status === 'CHECKED_IN' || status === 'IN_PROGRESS') return true;
  if (status !== 'CHECKING_OUT' && status !== 'COMPLETED') return false;
  const done = visitDoneAt(visit);
  if (!done) return false;
  return Date.now() - done.getTime() <= PRESCRIPTION_EDIT_MS;
}
