import { addDays, addMinutes, differenceInMinutes, setHours, setMinutes, setSeconds, startOfDay } from 'date-fns';

export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 20;
/** 64px/hour so a 30-min slot is 32px and can keep a 2px gap without overlapping. */
export const HOUR_PX = 64;
const SLOT_GAP_PX = 2;

/** True when slot start is strictly in the future (bookable). */
export function isFutureBookableSlot(slotStart: Date, now = new Date()): boolean {
  return slotStart.getTime() > now.getTime();
}

/** True when the visible week grid has at least one future bookable half-hour slot. */
export function weekHasFutureBookableSlots(
  weekDays: Date[],
  hourRange: HourRange,
  now = new Date()
): boolean {
  for (const d of weekDays) {
    for (let h = hourRange.startHour; h < hourRange.endHour; h++) {
      for (const minute of [0, 30]) {
        const slotStart = setSeconds(setMinutes(setHours(startOfDay(d), h), minute), 0);
        if (isFutureBookableSlot(slotStart, now)) return true;
      }
    }
  }
  return false;
}

export type HourRange = { startHour: number; endHour: number };

export function withLanes<T extends { start: Date; end: Date }>(
  events: T[]
): Array<T & { lane: number; laneCount: number }> {
  const sorted = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime()
  );
  const placed: { ev: T; lane: number }[] = [];
  for (const ev of sorted) {
    const used = new Set(
      placed.filter((p) => p.ev.start < ev.end && p.ev.end > ev.start).map((p) => p.lane)
    );
    let lane = 0;
    while (used.has(lane)) lane += 1;
    placed.push({ ev, lane });
  }

  const result: Array<T & { lane: number; laneCount: number }> = [];
  let i = 0;
  while (i < placed.length) {
    let clusterEnd = placed[i].ev.end.getTime();
    let j = i + 1;
    while (j < placed.length && placed[j].ev.start.getTime() < clusterEnd) {
      clusterEnd = Math.max(clusterEnd, placed[j].ev.end.getTime());
      j += 1;
    }
    const cluster = placed.slice(i, j);
    const laneCount = Math.max(1, ...cluster.map((p) => p.lane + 1));
    for (const p of cluster) {
      result.push({ ...p.ev, lane: p.lane, laneCount });
    }
    i = j;
  }
  return result;
}

export function visibleHourRange(events: { start: Date; end: Date }[], now?: Date): HourRange {
  let startHour = DAY_START_HOUR;
  let endHour = DAY_END_HOUR;
  for (const e of events) {
    if (!Number.isFinite(e.start.getTime())) continue;
    startHour = Math.min(startHour, e.start.getHours());
    const end = e.end > e.start ? e.end : addMinutes(e.start, 30);
    const sameDay =
      end.getFullYear() === e.start.getFullYear() &&
      end.getMonth() === e.start.getMonth() &&
      end.getDate() === e.start.getDate();
    if (!sameDay) {
      endHour = 24;
      continue;
    }
    let hour = end.getHours();
    if (end.getMinutes() > 0 || end.getSeconds() > 0 || end.getMilliseconds() > 0) hour += 1;
    endHour = Math.max(endHour, hour);
  }
  if (now && Number.isFinite(now.getTime())) {
    startHour = Math.min(startHour, now.getHours());
    endHour = Math.max(endHour, Math.min(24, now.getHours() + 1));
  }
  startHour = Math.max(0, startHour);
  endHour = Math.min(24, Math.max(startHour + 1, endHour));
  return { startHour, endHour };
}

/** Pixel offset of `now` from the top of the visible hour range, or null if off-grid. */
export function nowLineOffsetPx(now: Date, range: HourRange): number | null {
  if (!Number.isFinite(now.getTime())) return null;
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const startMins = range.startHour * 60;
  const endMins = range.endHour * 60;
  if (minutes < startMins || minutes > endMins) return null;
  return ((minutes - startMins) / 60) * HOUR_PX;
}

export function dayBounds(day: Date, startHour = DAY_START_HOUR, endHour = DAY_END_HOUR) {
  const dayStart = setSeconds(setMinutes(setHours(day, startHour), 0), 0);
  const dayEnd =
    endHour >= 24
      ? setSeconds(setMinutes(setHours(addDays(day, 1), 0), 0), 0)
      : setSeconds(setMinutes(setHours(day, endHour), 0), 0);
  return { dayStart, dayEnd };
}

export function eventLayout(
  ev: { start: Date; end: Date; lane: number; laneCount: number },
  day: Date,
  range?: Partial<HourRange>
): { top: number; height: number; leftPct: number; widthPct: number } | null {
  const startHour = range?.startHour ?? DAY_START_HOUR;
  const endHour = range?.endHour ?? DAY_END_HOUR;
  const { dayStart, dayEnd } = dayBounds(day, startHour, endHour);
  if (ev.end <= dayStart || ev.start >= dayEnd) return null;
  const clampedStart = ev.start < dayStart ? dayStart : ev.start;
  const clampedEnd = ev.end > dayEnd ? dayEnd : ev.end;
  const topMins = differenceInMinutes(clampedStart, dayStart);
  const durMins = Math.max(30, differenceInMinutes(clampedEnd, clampedStart));
  if (topMins >= (endHour - startHour) * 60 || durMins <= 0) return null;
  const top = (Math.max(0, topMins) / 60) * HOUR_PX;
  const slotPx = (durMins / 60) * HOUR_PX;
  const height = Math.max(SLOT_GAP_PX, slotPx - SLOT_GAP_PX);
  const widthPct = 100 / ev.laneCount;
  const leftPct = widthPct * ev.lane;
  return { top, height, leftPct, widthPct };
}

/** Map a click inside an hour cell to a :00 or :30 start on that day. */
export function slotStartFromHourClick(day: Date, hour: number, offsetY: number, cellHeight = HOUR_PX): Date {
  const minutes = offsetY >= cellHeight / 2 ? 30 : 0;
  return setSeconds(setMinutes(setHours(startOfDay(day), hour), minutes), 0);
}
