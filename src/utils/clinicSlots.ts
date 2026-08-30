/** Slot strings from the API are clinic-local wall clock with no offset (e.g. 2026-08-29T09:30). */
export const DEFAULT_CLINIC_TIMEZONE = 'Asia/Kolkata';

export function clinicLocalDateTimeKey(timeZone: string, at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

export function slotHasNotStarted(
  raw: string,
  timeZone = DEFAULT_CLINIC_TIMEZONE,
  now = new Date()
): boolean {
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!match) {
    const t = Date.parse(raw);
    return Number.isNaN(t) || t >= now.getTime();
  }
  return `${match[1]}T${match[2]}:${match[3]}` >= clinicLocalDateTimeKey(timeZone, now);
}

export function filterOpenSlots(
  slots: string[],
  timeZone = DEFAULT_CLINIC_TIMEZONE,
  now = new Date()
): string[] {
  return slots.filter((s) => slotHasNotStarted(s, timeZone, now));
}
