import { format, setHours, setMinutes, setSeconds, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { HOUR_PX, isFutureBookableSlot } from './weekCalendarLayout';
import type { HourRange } from './weekCalendarLayout';

type Props = {
  day: Date;
  hours: number[];
  hourRange: HourRange;
  now: Date;
  onSlotClick?: (start: Date) => void;
};

/** Half-hour booking zones for one day column. Past slots are non-interactive. */
export function WeekCalendarSlotLayer({ day, hours, hourRange, now, onSlotClick }: Props) {
  return hours.map((h) =>
    [0, 30].map((minute) => {
      const slotStart = setSeconds(setMinutes(setHours(startOfDay(day), h), minute), 0);
      const top = (h - hourRange.startHour) * HOUR_PX + (minute === 30 ? HOUR_PX / 2 : 0);
      const zoneClass = cn(
        'absolute left-0 right-0',
        minute === 30 ? 'border-b border-border/50' : 'border-b border-border/25'
      );
      if (!onSlotClick) {
        return (
          <div key={`${h}-${minute}`} className={zoneClass} style={{ top, height: HOUR_PX / 2 }} />
        );
      }
      if (isFutureBookableSlot(slotStart, now)) {
        return (
          <button
            key={`${h}-${minute}`}
            type="button"
            className={cn(
              zoneClass,
              'z-[1] hover:bg-primary/10 focus-visible:bg-primary/15 focus-visible:outline-none'
            )}
            style={{ top, height: HOUR_PX / 2 }}
            onClick={() => onSlotClick(slotStart)}
            aria-label={`Book ${format(day, 'EEE MMM d')} at ${format(slotStart, 'h:mm a')}`}
          />
        );
      }
      return (
        <div
          key={`${h}-${minute}`}
          className={cn(zoneClass, 'pointer-events-none cursor-not-allowed opacity-40')}
          style={{ top, height: HOUR_PX / 2 }}
          aria-hidden
        />
      );
    })
  );
}
