/** Visit triage: API uses `urgency: 'ROUTINE' | 'URGENT'`, not `isUrgent`. */
export function isUrgentVisit(urgency?: string | null): boolean {
  return urgency === 'URGENT';
}

/**
 * List/kanban. Pale fill + left stripe.
 * Sky = routine, rose = urgent (not waitlist amber, not error red).
 */
export const routineVisitSurfaceClass =
  'border-sky-200/80 bg-sky-50/70 dark:bg-sky-950/25 dark:border-sky-800 border-l-4 border-l-sky-500';

export const urgentVisitSurfaceClass =
  'border-rose-300 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-700 border-l-4 border-l-rose-600';

/** Treated / completed — emerald, not sky routine and not rose urgent. */
export const attendedVisitSurfaceClass =
  'border-emerald-200/80 bg-emerald-50/70 dark:bg-emerald-950/25 dark:border-emerald-800 border-l-4 border-l-emerald-500';

export function dashboardVisitSurfaceClass(urgent: boolean): string {
  return urgent ? urgentVisitSurfaceClass : routineVisitSurfaceClass;
}

/** Calendar: routine = sky, urgent = rose. Saturated + white text. Two hues only. */
export const routineCalendarBlockClass =
  'bg-sky-600 text-white border-sky-700';

export const urgentCalendarBlockClass =
  'bg-rose-600 text-white border-rose-700';

export function calendarBlockClass(urgent: boolean): string {
  return urgent ? urgentCalendarBlockClass : routineCalendarBlockClass;
}

export const urgentVisitBadgeClass =
  'border-transparent bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200';

export const routineVisitBadgeClass =
  'border-transparent bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200';
