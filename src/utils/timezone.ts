import { addMinutes, format } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  date: Date,
  timezone: string
): Date[] {
  const dateString = format(date, 'yyyy-MM-dd');
  const startUtc = zonedTimeToUtc(`${dateString} ${startTime}`, timezone);
  const endUtc = zonedTimeToUtc(`${dateString} ${endTime}`, timezone);

  const slots: Date[] = [];
  let current = startUtc;

  while (current < endUtc) {
    slots.push(current);
    current = addMinutes(current, durationMinutes);
  }

  return slots;
}
