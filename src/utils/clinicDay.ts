/** Civil calendar helpers for clinic IANA zones (default Asia/Kolkata). */

export const CLINIC_DAY_TIMEZONE = 'Asia/Kolkata';

/** Civil calendar parts for a clinic IANA zone (default Asia/Kolkata). */
export function clinicZonedParts(timeZone = CLINIC_DAY_TIMEZONE, at: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    weekday: get('weekday'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

/** `yyyy-MM-dd` in clinic zone — use for "Today" filters vs browser-local UTC skew. */
export function clinicTodayIso(timeZone = CLINIC_DAY_TIMEZONE, at: Date = new Date()): string {
  const p = clinicZonedParts(timeZone, at);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Local Date at start of clinic civil day (for date-fns isSameDay / startOfDay callers). */
export function clinicTodayDate(timeZone = CLINIC_DAY_TIMEZONE, at: Date = new Date()): Date {
  const iso = clinicTodayIso(timeZone, at);
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** Parent/doctor header e.g. "Sunday, September 6" in clinic zone. */
export function formatClinicTodayLong(timeZone = CLINIC_DAY_TIMEZONE, at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(at);
}
