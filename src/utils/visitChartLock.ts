import type { ClinicVisitModel } from '@/services/clinicService';

export function canEditVisitChart(visit: ClinicVisitModel | null | undefined): boolean {
  if (!visit) return false;
  const status = visit.status;
  return status === 'WAITLIST' || status === 'CHECKED_IN' || status === 'IN_PROGRESS';
}
