import { addMinutes, differenceInMinutes, parseISO, setHours, setMinutes, setSeconds } from 'date-fns';
import type { ClinicBookingModel, ClinicVisitModel } from '@/services/clinicService';

export type WeekCalEvent = {
  id: string;
  kind: 'visit' | 'booking';
  title: string;
  subtitle: string;
  start: Date;
  end: Date;
  status: string;
  doctorUuid?: string | null;
  visit?: ClinicVisitModel;
  booking?: ClinicBookingModel;
};

export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 20;
export const HOUR_PX = 48;

/** Stable pastel palette for doctor legend / calendar blocks. */
const DOCTOR_COLORS = [
  { bg: '#0ea5e9', border: '#0284c7', text: '#ffffff' },
  { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' },
  { bg: '#10b981', border: '#059669', text: '#ffffff' },
  { bg: '#f59e0b', border: '#d97706', text: '#ffffff' },
  { bg: '#ec4899', border: '#db2777', text: '#ffffff' },
  { bg: '#14b8a6', border: '#0d9488', text: '#ffffff' },
  { bg: '#6366f1', border: '#4f46e5', text: '#ffffff' },
  { bg: '#f97316', border: '#ea580c', text: '#ffffff' },
];

export function doctorColor(doctorUuid: string | null | undefined): {
  bg: string;
  border: string;
  text: string;
} | null {
  if (!doctorUuid) return null;
  let hash = 0;
  for (let i = 0; i < doctorUuid.length; i += 1) {
    hash = (hash * 31 + doctorUuid.charCodeAt(i)) >>> 0;
  }
  return DOCTOR_COLORS[hash % DOCTOR_COLORS.length];
}

export function visitEventTime(v: ClinicVisitModel): { start: Date; end: Date } {
  const raw =
    v.status === 'IN_PROGRESS' || v.status === 'CHECKING_OUT'
      ? v.startedAt || v.checkedInAt || v.createdAt
      : v.status === 'COMPLETED'
        ? v.completedAt || v.startedAt || v.createdAt
        : v.checkedInAt || v.createdAt;
  const start = raw ? parseISO(raw) : new Date();
  return { start, end: addMinutes(start, 30) };
}

export function statusTone(status: string) {
  const s = status.toUpperCase();
  if (s === 'IN_PROGRESS' || s === 'CONFIRMED') return 'bg-sky-500/90 text-white border-sky-600';
  if (s === 'CHECKED_IN' || s === 'WAITLIST') return 'bg-amber-500/90 text-white border-amber-600';
  if (s === 'CHECKING_OUT' || s === 'COMPLETED' || s === 'DONE') {
    return 'bg-emerald-600/90 text-white border-emerald-700';
  }
  if (s === 'CANCELLED' || s === 'NO_SHOW') return 'bg-muted text-muted-foreground border-border';
  return 'bg-primary/85 text-primary-foreground border-primary';
}

export function withLanes(
  events: WeekCalEvent[]
): Array<WeekCalEvent & { lane: number; laneCount: number }> {
  const sorted = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime()
  );
  const placed: { ev: WeekCalEvent; lane: number }[] = [];
  for (const ev of sorted) {
    const used = new Set(
      placed.filter((p) => p.ev.start < ev.end && p.ev.end > ev.start).map((p) => p.lane)
    );
    let lane = 0;
    while (used.has(lane)) lane += 1;
    placed.push({ ev, lane });
  }
  return placed.map(({ ev, lane }) => {
    const overlapping = placed.filter((p) => p.ev.start < ev.end && p.ev.end > ev.start);
    const laneCount = Math.max(1, Math.max(...overlapping.map((p) => p.lane)) + 1);
    return { ...ev, lane, laneCount };
  });
}

export function dayBounds(day: Date) {
  const dayStart = setSeconds(setMinutes(setHours(day, DAY_START_HOUR), 0), 0);
  const dayEnd = setSeconds(setMinutes(setHours(day, DAY_END_HOUR), 0), 0);
  return { dayStart, dayEnd };
}

export function eventLayout(
  ev: WeekCalEvent & { lane: number; laneCount: number },
  day: Date
): { top: number; height: number; leftPct: number; widthPct: number } | null {
  const { dayStart, dayEnd } = dayBounds(day);
  const clampedStart = ev.start < dayStart ? dayStart : ev.start;
  const clampedEnd =
    ev.end > dayEnd ? dayEnd : ev.end > clampedStart ? ev.end : addMinutes(clampedStart, 30);
  const topMins = differenceInMinutes(clampedStart, dayStart);
  const durMins = Math.max(30, differenceInMinutes(clampedEnd, clampedStart));
  if (topMins >= (DAY_END_HOUR - DAY_START_HOUR) * 60 || topMins + durMins <= 0) return null;
  const top = (Math.max(0, topMins) / 60) * HOUR_PX;
  const height = Math.max(28, (durMins / 60) * HOUR_PX - 2);
  const widthPct = 100 / ev.laneCount;
  const leftPct = widthPct * ev.lane;
  return { top: top + 1, height, leftPct, widthPct };
}

/** Creative star adjectives (1–5). */
export function ratingAdjective(stars: number | null | undefined): string {
  if (stars == null || !Number.isFinite(stars) || stars <= 0) return 'Not rated yet';
  const n = Math.round(stars);
  if (n <= 1) return 'Still warming up';
  if (n === 2) return 'Gentle paws';
  if (n === 3) return 'Trusted companion';
  if (n === 4) return 'Clinic favorite';
  return 'Legend of care';
}

export function buildWeekEvents(
  visits: ClinicVisitModel[],
  bookings: ClinicBookingModel[]
): WeekCalEvent[] {
  const events: WeekCalEvent[] = [];
  for (const v of visits) {
    const { start, end } = visitEventTime(v);
    events.push({
      id: `visit-${v.uuid}`,
      kind: 'visit',
      title: v.petName,
      subtitle: `${v.ownerName || 'Owner'}${v.doctorName ? ` · Dr. ${v.doctorName}` : ''}${
        v.reasonForVisit ? ` · ${v.reasonForVisit}` : ''
      }`,
      start,
      end,
      status: v.status,
      doctorUuid: v.doctorUuid,
      visit: v,
    });
  }
  for (const b of bookings) {
    if (!b.slotStart) continue;
    if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes((b.status || '').toUpperCase())) continue;
    const start = parseISO(b.slotStart);
    const end = b.slotEnd ? parseISO(b.slotEnd) : addMinutes(start, 30);
    events.push({
      id: `booking-${b.uuid}`,
      kind: 'booking',
      title: b.petName,
      subtitle: `${b.ownerName || 'Owner'}${b.notes ? ` · ${b.notes}` : ''}`,
      start,
      end,
      status: b.status,
      doctorUuid: b.doctorUuid,
      booking: b,
    });
  }
  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}
