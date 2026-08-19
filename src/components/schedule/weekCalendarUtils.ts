import { addMinutes, parseISO } from 'date-fns';
import type { ClinicBookingModel, ClinicVisitModel } from '@/services/clinicService';
import { petNameWithType } from '@/utils/petType';

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

export {
  DAY_END_HOUR,
  DAY_START_HOUR,
  HOUR_PX,
  dayBounds,
  eventLayout,
  visibleHourRange,
  withLanes,
} from './weekCalendarLayout';
export type { HourRange } from './weekCalendarLayout';

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
      title: petNameWithType(v.petName, v.species),
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
      title: petNameWithType(b.petName, b.species),
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
