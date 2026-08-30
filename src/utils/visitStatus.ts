import { isSameDay, parseISO, startOfDay } from 'date-fns';
import { isUrgentVisit } from '@/utils/visitUrgency';

/** Human visit status for dashboards. Do not use for ecommerce /checkout. */
export function visitStatusLabel(status?: string | null): string {
  switch ((status || '').toUpperCase()) {
    case 'COMPLETED':
      return 'Completed';
    case 'CHECKING_OUT':
      return 'Ready to invoice';
    case 'IN_PROGRESS':
      return 'With doctor';
    case 'CHECKED_IN':
      return 'Checked in';
    case 'WAITLIST':
      return 'Waitlist';
    case 'CANCELLED':
      return 'Cancelled';
    case 'NO_SHOW':
      return 'No show';
    default:
      return (status || '').replace(/_/g, ' ') || '—';
  }
}

/** Urgent dashboard queue: still waiting for a doctor. */
export function isUrgentDashboardVisit(status?: string | null): boolean {
  const s = (status || '').toUpperCase();
  return s === 'WAITLIST' || s === 'CHECKED_IN';
}

export function isUrgentQueueStatus(status?: string | null): boolean {
  return isUrgentDashboardVisit(status);
}

export function isAttendedVisitStatus(status?: string | null): boolean {
  const s = (status || '').toUpperCase();
  return s === 'IN_PROGRESS' || s === 'CHECKING_OUT' || s === 'COMPLETED';
}

const TERMINAL_VISIT = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW']);
const CALENDAR_EXCLUDED = new Set(['CANCELLED', 'NO_SHOW']);

export function isTerminalVisitStatus(status?: string | null): boolean {
  return TERMINAL_VISIT.has((status || '').toUpperCase());
}

/** Hide from week calendar only — attended/completed visits stay visible. */
export function isCalendarExcludedStatus(status?: string | null): boolean {
  return CALENDAR_EXCLUDED.has((status || '').toUpperCase());
}

/** Finished or invoicing — render muted on calendar. */
export function isAttendedCalendarVisit(status?: string | null): boolean {
  const s = (status || '').toUpperCase();
  return s === 'COMPLETED' || s === 'CHECKING_OUT';
}

export type UrgentVisitLike = {
  urgency?: string | null;
  status?: string | null;
  petUuid?: string | null;
  startedAt?: string | null;
  checkedInAt?: string | null;
  createdAt?: string | null;
};

/** Schedule anchor aligned with week calendar day bucketing. */
export function visitScheduleInstant(visit: UrgentVisitLike): Date | null {
  const raw = visit.startedAt || visit.checkedInAt || visit.createdAt;
  if (!raw) return null;
  try {
    return parseISO(raw);
  } catch {
    return null;
  }
}

/** True when visit belongs on the given calendar day. */
export function isVisitOnDay(visit: UrgentVisitLike, day: Date): boolean {
  const instant = visitScheduleInstant(visit);
  if (instant && isSameDay(instant, day)) return true;
  if (visit.createdAt) {
    try {
      return isSameDay(parseISO(visit.createdAt), day);
    } catch {
      return false;
    }
  }
  return false;
}

/** Pets already with a doctor or finished today — hide duplicate urgent queue rows. */
export function buildAttendedPetUuids(visits: UrgentVisitLike[]): Set<string> {
  const ids = new Set<string>();
  for (const visit of visits) {
    if (isAttendedVisitStatus(visit.status) && visit.petUuid) {
      ids.add(visit.petUuid);
    }
  }
  return ids;
}

/** Doctor portal + bell: urgent patients still waiting for care. */
export function filterUrgentAttentionQueue<T extends UrgentVisitLike>(visits: T[]): T[] {
  const attended = buildAttendedPetUuids(visits);
  return visits.filter((visit) => {
    if (!isUrgentVisit(visit.urgency)) return false;
    if (!isUrgentQueueStatus(visit.status)) return false;
    if (visit.petUuid && attended.has(visit.petUuid)) return false;
    return true;
  });
}

/** Clinic portal: all non-terminal urgent visits today (upstream behavior). */
export function filterClinicUrgentToday<T extends UrgentVisitLike>(
  visits: T[],
  day: Date = startOfDay(new Date())
): T[] {
  return visits.filter((visit) => {
    if (!isUrgentVisit(visit.urgency)) return false;
    if (isTerminalVisitStatus(visit.status)) return false;
    return isVisitOnDay(visit, day);
  });
}

/** @deprecated Use filterUrgentAttentionQueue or filterClinicUrgentToday. */
export function filterUrgentDashboardVisits<T extends UrgentVisitLike>(
  visits: T[],
  opts?: { todayOnly?: boolean; visitDay?: (visit: T) => Date }
): T[] {
  const today = opts?.todayOnly ? startOfDay(new Date()) : null;
  const filtered = filterUrgentAttentionQueue(visits);
  if (!today || !opts?.visitDay) return filtered;
  return filtered.filter((visit) => isSameDay(opts.visitDay!(visit), today));
}
