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

export type DoctorDaySlots = {
  slots: string[];
  closed: boolean;
  hoursLabel?: string | null;
};

export function slotMinuteKey(raw: string): string {
  const match = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return match ? match[1] : raw;
}

export function slotStartParts(raw: string): { date: string; time: string } | null {
  const key = slotMinuteKey(raw);
  const match = key.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? { date: match[1], time: match[2] } : null;
}

function formatClock(hhmm: string): string {
  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return hhmm.trim();
  const hour24 = Number(match[1]);
  const minutes = match[2];
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

/** Turn `09:00–17:00` into `9:00 AM–5:00 PM`. */
export function formatHoursLabel(raw: string): string {
  return raw
    .split(',')
    .map((part) => {
      const trimmed = part.trim();
      const bits = trimmed.split(/\u2013|–|-/);
      if (bits.length < 2) return trimmed;
      return `${formatClock(bits[0])}–${formatClock(bits[1])}`;
    })
    .join(', ');
}

export function doctorSlotBusyHint(args: {
  closed: boolean;
  slots: string[];
  selectedKey: string;
  selectedLabel: string;
  hoursLabel?: string | null;
  keepingOwn?: boolean;
}): string | null {
  if (args.keepingOwn) return null;
  if (args.closed) return 'Doctor is not working this day';
  if (args.slots.length === 0) return 'No remaining slots this day';
  const open = args.slots.some((s) => slotMinuteKey(s) === args.selectedKey);
  if (open) return null;
  const hours = args.hoursLabel?.trim();
  if (hours) {
    return `Doctor not available at ${args.selectedLabel} — hours today ${formatHoursLabel(hours)}`;
  }
  return `Doctor not available at ${args.selectedLabel} — outside working hours or already booked`;
}
